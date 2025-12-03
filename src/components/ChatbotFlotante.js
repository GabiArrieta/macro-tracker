import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

const ChatbotFlotante = ({ alimentos, comidas, fecha, onAgregarAlimento, onAgregarComida, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      tipo: 'bot',
      texto: '¡Hola! 👋 Soy tu asistente de nutrición. Puedo ayudarte a:\n• Agregar alimentos a tu registro\n• Buscar comidas guardadas\n• Buscar productos en la web\n\n¿Qué comiste hoy?'
    }
  ]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [procesando, setProcesando] = useState(false);
  const mensajesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const agregarMensaje = (tipo, texto, opciones = {}) => {
    setMensajes(prev => [...prev, { 
      tipo, 
      texto, 
      timestamp: new Date(),
      acciones: opciones.acciones || null,
      data: opciones.data || null
    }]);
  };

  const detectarTipoComida = (texto) => {
    const textoLower = texto.toLowerCase();
    const tiposComida = {
      'desayuno': 'desayuno',
      'desayuné': 'desayuno',
      'desayune': 'desayuno',
      'almuerzo': 'almuerzo',
      'almorcé': 'almuerzo',
      'almorce': 'almuerzo',
      'almorzé': 'almuerzo',
      'comí': 'almuerzo',
      'comi': 'almuerzo',
      'merienda': 'merienda',
      'cené': 'cena',
      'cene': 'cena',
      'cena': 'cena',
      'snack': 'snacks',
      'snacks': 'snacks',
      'colación': 'snacks',
      'colacion': 'snacks'
    };

    for (const [palabra, tipo] of Object.entries(tiposComida)) {
      if (textoLower.includes(palabra)) {
        return tipo;
      }
    }
    return 'extra'; // Por defecto
  };

  const procesarMensaje = async (texto) => {
    setProcesando(true);
    agregarMensaje('usuario', texto);
    setInputMensaje('');

    try {
      // Detectar tipo de comida del mensaje
      const tipoComidaDetectado = detectarTipoComida(texto);
      
      // Primero buscar en alimentos y comidas locales
      const resultadoLocal = await buscarLocalmente(texto);
      
      if (resultadoLocal.alimentos.length > 0 || resultadoLocal.comidas.length > 0) {
        mostrarResultadosLocales(resultadoLocal, texto, tipoComidaDetectado);
      } else {
        // Si no encuentra nada local, buscar en la web
        agregarMensaje('bot', 'No encontré ese alimento en tu base de datos. Buscando información en la web... 🔍');
        const resultadoWeb = await buscarEnWeb(texto);
        mostrarResultadosWeb(resultadoWeb, texto, tipoComidaDetectado);
      }
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      agregarMensaje('bot', 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const buscarLocalmente = async (texto) => {
    const textoLower = texto.toLowerCase();
    const alimentosEncontrados = [];
    const comidasEncontradas = [];

    // Buscar en alimentos
    alimentos.forEach(alimento => {
      const nombreLower = alimento.nombre.toLowerCase();
      if (textoLower.includes(nombreLower) || nombreLower.includes(textoLower.split(' ')[0])) {
        let cantidad = 1;
        let modo = 'porcion';
        
        const patterns = [
          new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:g|gramos?|gr|ml|mililitros?)?\\s*(?:de\\s+)?${nombreLower}`, 'i'),
          new RegExp(`(\\d+(?:\\.\\d+)?)\\s+${nombreLower}`, 'i'),
        ];
        
        for (const pattern of patterns) {
          const match = texto.match(pattern);
          if (match) {
            cantidad = parseFloat(match[1]);
            if (textoLower.match(/\b(g|gramos?|gr|ml|mililitros?)\b/i)) {
              modo = 'peso';
            }
            break;
          }
        }

        alimentosEncontrados.push({
          alimento_id: alimento.id,
          alimento: alimento,
          cantidad: cantidad,
          modo: modo
        });
      }
    });

    // Buscar en comidas
    comidas.forEach(comida => {
      const nombreLower = comida.nombre.toLowerCase();
      if (textoLower.includes(nombreLower) || nombreLower.includes(textoLower.split(' ')[0])) {
        comidasEncontradas.push(comida);
      }
    });

    return { alimentos: alimentosEncontrados, comidas: comidasEncontradas };
  };

  const buscarEnWeb = async (texto) => {
    try {
      const response = await axios.post(`${API_URL}/ai/buscar-web`, {
        query: texto,
        fecha: fecha
      });
      return response.data;
    } catch (error) {
      console.error('Error buscando en web:', error);
      return { productos: [], error: 'No pude buscar información en la web' };
    }
  };

  const mostrarResultadosLocales = (resultado, textoOriginal, tipoComida) => {
    if (resultado.comidas.length > 0) {
      agregarMensaje('bot', `Encontré ${resultado.comidas.length} comida(s) guardada(s):`);
      resultado.comidas.forEach(comida => {
        agregarMensaje('bot', `🍽️ ${comida.nombre}`, {
          acciones: [
            { texto: 'Agregar', accion: () => agregarComida(comida.id, tipoComida) }
          ]
        });
      });
    }

    if (resultado.alimentos.length > 0) {
      const listaAlimentos = resultado.alimentos.map(item => {
        const cantidad = item.modo === 'porcion' 
          ? `${item.cantidad} porción(es)`
          : `${item.cantidad}g`;
        return `• ${item.alimento.nombre} (${cantidad})`;
      }).join('\n');

      const tipoComidaLabel = tipoComida !== 'extra' ? ` como ${tipoComida}` : '';
      agregarMensaje('bot', `Encontré ${resultado.alimentos.length} alimento(s) en tu base de datos:\n${listaAlimentos}\n\n¿Agregar${tipoComidaLabel}?`, {
        acciones: [
          { texto: `Agregar${tipoComidaLabel}`, accion: () => agregarAlimentos(resultado.alimentos, tipoComida) }
        ]
      });
    }

    if (resultado.alimentos.length === 0 && resultado.comidas.length === 0) {
      agregarMensaje('bot', 'No encontré ese alimento en tu base de datos. Buscando en la web... 🔍');
    }
  };

  const mostrarResultadosWeb = (resultado, textoOriginal, tipoComida) => {
    if (resultado.productos && resultado.productos.length > 0) {
      resultado.productos.forEach((producto, index) => {
        const fuenteInfo = producto.fuente === 'openfoodfacts' ? '🌐 (Open Food Facts)' :
                          producto.fuente === 'usda' ? '🌐 (USDA)' :
                          producto.fuente === 'base_datos_comun' ? '📚 (Base de datos)' :
                          '⚠️ (Estimado)';
        
        const tipoComidaLabel = tipoComida !== 'extra' ? ` como ${tipoComida}` : '';
        
        const info = `📦 ${producto.nombre} ${fuenteInfo}\n` +
          `Calorías: ${producto.calorias || 'N/A'} cal\n` +
          `Grasas: ${producto.grasas || 'N/A'}g | Carbs: ${producto.carbohidratos || 'N/A'}g | Proteínas: ${producto.proteinas || 'N/A'}g` +
          (producto.nota ? `\n\n⚠️ ${producto.nota}` : '') +
          `\n\n¿Agregar${tipoComidaLabel}?`;
        
        agregarMensaje('bot', info, {
          acciones: [
            { texto: `Agregar${tipoComidaLabel}`, accion: () => agregarProductoWeb(producto, textoOriginal, tipoComida) },
            { texto: 'Guardar en Mis Alimentos', accion: () => guardarProductoEnAlimentos(producto) }
          ]
        });
      });
    } else {
      agregarMensaje('bot', 'No encontré información nutricional de ese producto. ¿Puedes ser más específico? Por ejemplo: "yogur ser proteico" o "snack yogur marca ser"');
    }
  };

  const agregarAlimentos = async (alimentosLista, tipoComida = 'extra') => {
    try {
      for (const item of alimentosLista) {
        let cantidadFinal = item.cantidad;
        if (item.modo === 'porcion') {
          cantidadFinal = cantidadFinal * (item.alimento.peso_porcion || 100);
        }

        await axios.post(`${API_URL}/registros`, {
          fecha,
          tipo_comida: tipoComida,
          alimento_id: item.alimento_id,
          cantidad: cantidadFinal
        });
      }

      const tipoLabel = tipoComida !== 'extra' ? ` como ${tipoComida}` : '';
      agregarMensaje('bot', `✅ ${alimentosLista.length} alimento(s) agregado(s)${tipoLabel} exitosamente!`);
      if (onAgregarAlimento) onAgregarAlimento();
      if (onRefresh) onRefresh();
    } catch (error) {
      agregarMensaje('bot', '❌ Error al agregar los alimentos. Intenta de nuevo.');
    }
  };

  const agregarComida = async (comidaId, tipoComida = 'extra') => {
    try {
      await axios.post(`${API_URL}/registros/comida`, {
        fecha,
        tipo_comida: tipoComida,
        comida_id: comidaId
      });

      const tipoLabel = tipoComida !== 'extra' ? ` como ${tipoComida}` : '';
      agregarMensaje('bot', `✅ Comida agregada${tipoLabel} exitosamente!`);
      if (onAgregarComida) onAgregarComida();
      if (onRefresh) onRefresh();
    } catch (error) {
      agregarMensaje('bot', '❌ Error al agregar la comida. Intenta de nuevo.');
    }
  };

  const agregarProductoWeb = async (producto, textoOriginal, tipoComida = 'extra') => {
    try {
      // Primero crear el alimento en la base de datos
      const alimentoResponse = await axios.post(`${API_URL}/alimentos`, {
        nombre: producto.nombre,
        calorias: producto.calorias || 0,
        grasas: producto.grasas || 0,
        carbohidratos: producto.carbohidratos || 0,
        proteinas: producto.proteinas || 0,
        sodio: producto.sodio || 0,
        peso_porcion: producto.peso_porcion || 100
      });

      // Luego agregarlo al registro con el tipo de comida correcto
      await axios.post(`${API_URL}/registros`, {
        fecha,
        tipo_comida: tipoComida,
        alimento_id: alimentoResponse.data.id,
        cantidad: producto.peso_porcion || 100
      });

      const tipoLabel = tipoComida !== 'extra' ? ` como ${tipoComida}` : '';
      agregarMensaje('bot', `✅ Producto "${producto.nombre}" agregado${tipoLabel} exitosamente!`);
      if (onAgregarAlimento) onAgregarAlimento();
      if (onRefresh) onRefresh();
    } catch (error) {
      agregarMensaje('bot', '❌ Error al agregar el producto. Intenta de nuevo.');
    }
  };

  const guardarProductoEnAlimentos = async (producto) => {
    try {
      await axios.post(`${API_URL}/alimentos`, {
        nombre: producto.nombre,
        calorias: producto.calorias || 0,
        grasas: producto.grasas || 0,
        carbohidratos: producto.carbohidratos || 0,
        proteinas: producto.proteinas || 0,
        sodio: producto.sodio || 0,
        peso_porcion: producto.peso_porcion || 100
      });

      agregarMensaje('bot', `✅ Producto "${producto.nombre}" guardado en "Mis Alimentos"!`);
      if (onRefresh) onRefresh();
    } catch (error) {
      agregarMensaje('bot', '❌ Error al guardar el producto. Intenta de nuevo.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMensaje.trim() || procesando) return;
    procesarMensaje(inputMensaje);
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          className="chatbot-button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontSize: '24px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          🤖
        </button>
      )}

      {/* Chatbot window */}
      {isOpen && (
        <div
          className="chatbot-window"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            height: '600px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '12px 12px 0 0'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>🤖 Asistente Nutricional</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                Pregúntame sobre tus comidas
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                width: '30px',
                height: '30px'
              }}
            >
              ×
            </button>
          </div>

          {/* Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {mensajes.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.tipo === 'usuario' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '10px 15px',
                  borderRadius: '12px',
                  backgroundColor: msg.tipo === 'usuario' ? '#4CAF50' : '#f0f0f0',
                  color: msg.tipo === 'usuario' ? 'white' : '#333',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px'
                }}
              >
                {msg.texto}
                {msg.acciones && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {msg.acciones.map((accion, i) => (
                      <button
                        key={i}
                        onClick={accion.accion}
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          backgroundColor: msg.tipo === 'usuario' ? 'rgba(255,255,255,0.2)' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        {accion.texto}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {procesando && (
              <div style={{ alignSelf: 'flex-start', color: '#666', fontSize: '14px' }}>
                Pensando...
              </div>
            )}
            <div ref={mensajesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{ padding: '15px', borderTop: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputMensaje}
                onChange={(e) => setInputMensaje(e.target.value)}
                placeholder="Escribe aquí..."
                disabled={procesando}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                disabled={procesando || !inputMensaje.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotFlotante;

