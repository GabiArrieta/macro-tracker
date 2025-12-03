import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

const AsistenteIA = ({ alimentos, fecha, tipoComida, onAgregarAlimento, onClose }) => {
  const [mensaje, setMensaje] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const procesarTexto = async (texto) => {
    // Extraer alimentos del texto usando lógica simple primero
    // Ejemplo: "Comí 2 huevos y 100g de pan"
    
    const alimentosEncontrados = [];
    const textoLower = texto.toLowerCase();
    
    // Buscar alimentos en la base de datos que coincidan con el texto
    alimentos.forEach(alimento => {
      const nombreLower = alimento.nombre.toLowerCase();
      if (textoLower.includes(nombreLower)) {
        // Intentar extraer cantidad
        let cantidad = 1;
        let modo = 'porcion';
        
        // Buscar números antes del nombre del alimento
        const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:g|gramos?|gr)?\\s*${nombreLower}`, 'i');
        const match = texto.match(regex);
        
        if (match) {
          cantidad = parseFloat(match[1]);
          if (textoLower.includes('g') || textoLower.includes('gramos')) {
            modo = 'peso';
          }
        } else {
          // Buscar números simples antes del alimento
          const regexSimple = new RegExp(`(\\d+(?:\\.\\d+)?)\\s+${nombreLower}`, 'i');
          const matchSimple = texto.match(regexSimple);
          if (matchSimple) {
            cantidad = parseFloat(matchSimple[1]);
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
    
    return alimentosEncontrados;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    setProcesando(true);
    setError(null);
    setResultado(null);

    try {
      // Primero intentar procesar localmente
      const alimentosEncontrados = await procesarTexto(mensaje);
      
      if (alimentosEncontrados.length > 0) {
        setResultado({
          alimentos: alimentosEncontrados,
          mensaje: `Encontré ${alimentosEncontrados.length} alimento(s). ¿Quieres agregarlos?`
        });
      } else {
        // Si no encuentra nada, usar IA para procesar
        const response = await axios.post(`${API_URL}/ai/procesar`, {
          texto: mensaje,
          tipo_comida: tipoComida,
          fecha: fecha
        });
        
        if (response.data.alimentos && response.data.alimentos.length > 0) {
          setResultado({
            alimentos: response.data.alimentos,
            mensaje: response.data.mensaje || `Encontré ${response.data.alimentos.length} alimento(s). ¿Quieres agregarlos?`
          });
        } else {
          setError('No pude identificar alimentos en tu mensaje. Intenta ser más específico, por ejemplo: "Comí 2 huevos y 100g de pan"');
        }
      }
    } catch (err) {
      console.error('Error procesando mensaje:', err);
      setError('Error al procesar tu mensaje. Intenta de nuevo o agrega los alimentos manualmente.');
    } finally {
      setProcesando(false);
    }
  };

  const handleAgregarTodos = async () => {
    if (!resultado || !resultado.alimentos) return;

    try {
      setProcesando(true);
      
      for (const item of resultado.alimentos) {
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

      // Llamar al callback para refrescar
      if (onAgregarAlimento) {
        onAgregarAlimento();
      }
      
      setMensaje('');
      setResultado(null);
      alert(`¡${resultado.alimentos.length} alimento(s) agregado(s) exitosamente!`);
    } catch (err) {
      console.error('Error agregando alimentos:', err);
      setError('Error al agregar los alimentos. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 Asistente IA - {tipoComida}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Describe lo que comiste y el asistente lo agregará automáticamente.
            <br />
            <strong>Ejemplos:</strong>
            <br />
            • "Comí 2 huevos y 100g de pan"
            <br />
            • "Desayuné 1 banana y 50g de avena"
            <br />
            • "Tomé 200ml de leche y 30g de cereales"
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>¿Qué comiste?</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Ej: Comí 2 huevos, 100g de pan integral y un café con leche"
              rows="4"
              style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px' }}
              disabled={procesando}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={procesando || !mensaje.trim()}
            >
              {procesando ? 'Procesando...' : 'Procesar'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={procesando}
            >
              Cancelar
            </button>
          </div>
        </form>

        {error && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#ffebee', 
            color: '#c62828',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {resultado && resultado.alimentos && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <p style={{ marginBottom: '10px', fontWeight: '500' }}>{resultado.mensaje}</p>
              
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th>Alimento</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.alimentos.map((item, index) => (
                    <tr key={index}>
                      <td>{item.alimento.nombre}</td>
                      <td>
                        {item.modo === 'porcion' 
                          ? `${item.cantidad} porción(es)`
                          : `${item.cantidad}g`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={handleAgregarTodos}
                disabled={procesando}
              >
                Agregar Todos
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setResultado(null);
                  setMensaje('');
                }}
                disabled={procesando}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsistenteIA;

