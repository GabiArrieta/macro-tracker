import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { formatNutrient } from '../utils';
import AsistenteIA from './AsistenteIA';
import BuscadorAlimentos from './BuscadorAlimentos';

const API_URL = config.API_URL;

const TIPOS_COMIDA = [
  { id: 'desayuno', label: 'Desayuno', icon: '🌅' },
  { id: 'almuerzo', label: 'Almuerzo', icon: '🍽️' },
  { id: 'merienda', label: 'Merienda', icon: '☕' },
  { id: 'cena', label: 'Cena', icon: '🌙' },
  { id: 'snacks', label: 'Snacks', icon: '🍿' },
  { id: 'extra', label: 'Extra', icon: '➕' }
];

const RegistroDiario = ({ limites }) => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [alimentos, setAlimentos] = useState([]);
  const [comidas, setComidas] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [resumen, setResumen] = useState({ por_comida: [], total_dia: {} });
  const [showModal, setShowModal] = useState(false);
  const [showComidaModal, setShowComidaModal] = useState(false);
  const [showAsistenteModal, setShowAsistenteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [registroEditando, setRegistroEditando] = useState(null);
  const [tipoComidaSeleccionado, setTipoComidaSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    alimento_id: '',
    cantidad: '',
    modo_cantidad: 'porcion' // 'porcion' o 'peso'
  });
  const [editFormData, setEditFormData] = useState({
    cantidad: '',
    modo_cantidad: 'peso' // Por defecto peso porque ya está en gramos
  });
  const [comidaSeleccionada, setComidaSeleccionada] = useState('');

  useEffect(() => {
    fetchAlimentos();
    fetchComidas();
    fetchRegistros();
  }, [fecha]);

  const fetchAlimentos = async () => {
    try {
      const response = await axios.get(`${API_URL}/alimentos`);
      setAlimentos(response.data);
    } catch (error) {
      console.error('Error cargando alimentos:', error);
    }
  };

  const fetchComidas = async () => {
    try {
      const response = await axios.get(`${API_URL}/comidas`);
      setComidas(response.data);
    } catch (error) {
      console.error('Error cargando comidas:', error);
    }
  };

  const fetchRegistros = async () => {
    try {
      const response = await axios.get(`${API_URL}/registros/${fecha}`);
      console.log('Registros obtenidos:', response.data);
      // Verificar que todos los registros tengan ID
      const registrosConId = response.data.map(r => {
        if (!r.id) {
          console.warn('Registro sin ID:', r);
        }
        return r;
      });
      setRegistros(registrosConId);
      
      const resumenResponse = await axios.get(`${API_URL}/registros/${fecha}/resumen`);
      setResumen(resumenResponse.data);
    } catch (error) {
      console.error('Error cargando registros:', error);
    }
  };

  const handleAgregarAlimento = (tipoComida) => {
    setTipoComidaSeleccionado(tipoComida);
    setFormData({ alimento_id: '', cantidad: '', modo_cantidad: 'porcion' });
    setShowModal(true);
  };

  const handleAgregarComida = (tipoComida) => {
    setTipoComidaSeleccionado(tipoComida);
    setComidaSeleccionada('');
    setShowComidaModal(true);
  };

  const handleSubmitComida = async (e) => {
    e.preventDefault();
    if (!comidaSeleccionada) {
      alert('Por favor selecciona una comida');
      return;
    }

    try {
      await axios.post(`${API_URL}/registros/comida`, {
        fecha,
        tipo_comida: tipoComidaSeleccionado,
        comida_id: parseInt(comidaSeleccionada)
      });

      fetchRegistros();
      setShowComidaModal(false);
      setComidaSeleccionada('');
    } catch (error) {
      console.error('Error agregando comida:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`Error al agregar la comida: ${errorMessage}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const alimentoSeleccionado = alimentos.find(a => a.id === parseInt(formData.alimento_id));
      if (!alimentoSeleccionado) {
        alert('Por favor selecciona un alimento');
        return;
      }

      let cantidadFinal = parseFloat(formData.cantidad);
      
      // Si el modo es "porcion", la cantidad es un multiplicador (ej: 0.5, 1, 2)
      // Si el modo es "peso", la cantidad es en gramos y necesitamos convertir a factor
      if (formData.modo_cantidad === 'peso') {
        // Convertir peso en gramos a factor basado en peso_porcion
        cantidadFinal = cantidadFinal; // Guardamos el peso real
      } else {
        // Si es por porción, multiplicamos por el peso_porcion para obtener gramos
        cantidadFinal = cantidadFinal * (alimentoSeleccionado.peso_porcion || 100);
      }

      await axios.post(`${API_URL}/registros`, {
        fecha,
        tipo_comida: tipoComidaSeleccionado,
        alimento_id: parseInt(formData.alimento_id),
        cantidad: cantidadFinal
      });

      fetchRegistros();
      setShowModal(false);
      setFormData({ alimento_id: '', cantidad: '', modo_cantidad: 'porcion' });
    } catch (error) {
      console.error('Error agregando alimento:', error);
      alert('Error al agregar el alimento');
    }
  };

  const handleEditarRegistro = (registro) => {
    console.log('Editando registro:', registro);
    
    if (!registro || !registro.id) {
      alert('Error: El registro no tiene un ID válido');
      return;
    }

    setRegistroEditando(registro);
    // Calcular si la cantidad es más cercana a porciones o peso
    const alimento = alimentos.find(a => a.id === registro.alimento_id);
    if (alimento) {
      const pesoPorcion = alimento.peso_porcion || 100;
      const porciones = registro.cantidad / pesoPorcion;
      
      // Si es muy cercano a un número entero, usar modo porción
      if (Math.abs(porciones - Math.round(porciones)) < 0.1) {
        setEditFormData({
          cantidad: Math.round(porciones).toString(),
          modo_cantidad: 'porcion'
        });
      } else {
        setEditFormData({
          cantidad: registro.cantidad.toString(),
          modo_cantidad: 'peso'
        });
      }
    } else {
      setEditFormData({
        cantidad: registro.cantidad.toString(),
        modo_cantidad: 'peso'
      });
    }
    setShowEditModal(true);
  };

  const handleActualizarRegistro = async (e) => {
    e.preventDefault();
    if (!registroEditando) {
      alert('No hay registro seleccionado para editar');
      return;
    }

    try {
      const cantidadNum = parseFloat(editFormData.cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
      }

      let cantidadFinal = cantidadNum;
      const alimento = alimentos.find(a => a.id === registroEditando.alimento_id);
      
      if (alimento && editFormData.modo_cantidad === 'porcion') {
        cantidadFinal = cantidadNum * (alimento.peso_porcion || 100);
      }

      // Verificar que el ID existe
      if (!registroEditando.id) {
        alert('Error: El registro no tiene un ID válido');
        return;
      }

      console.log('Actualizando registro:', {
        id: registroEditando.id,
        cantidad: cantidadFinal,
        url: `${API_URL}/registros/${registroEditando.id}`
      });

      const response = await axios.put(`${API_URL}/registros/${registroEditando.id}`, {
        cantidad: cantidadFinal
      });

      if (response.data) {
        fetchRegistros();
        setShowEditModal(false);
        setRegistroEditando(null);
        setEditFormData({ cantidad: '', modo_cantidad: 'peso' });
      }
    } catch (error) {
      console.error('Error actualizando registro:', error);
      console.error('Detalles:', {
        id: registroEditando?.id,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      const statusCode = error.response?.status;
      
      if (statusCode === 404) {
        alert(`Error 404: No se encontró el registro con ID ${registroEditando.id}. Puede que haya sido eliminado.`);
      } else {
        alert(`Error al actualizar el registro: ${errorMessage} (Código: ${statusCode || 'N/A'})`);
      }
    }
  };

  const handleEliminarRegistro = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/registros/${id}`);
      fetchRegistros();
    } catch (error) {
      console.error('Error eliminando registro:', error);
      alert('Error al eliminar el registro');
    }
  };

  const getRegistrosPorComida = (tipoComida) => {
    return registros.filter(r => r.tipo_comida === tipoComida);
  };

  const getResumenPorComida = (tipoComida) => {
    const resumenComida = resumen.por_comida.find(r => r.tipo_comida === tipoComida);
    return resumenComida || {
      total_calorias: 0,
      total_grasas: 0,
      total_carbohidratos: 0,
      total_proteinas: 0,
      total_sodio: 0
    };
  };

  const calcularPorcentaje = (actual, limite) => {
    if (!limite || limite === 0) return 0;
    return Math.min((actual / limite) * 100, 100);
  };

  const getProgressColor = (porcentaje) => {
    if (porcentaje >= 100) return 'danger';
    if (porcentaje >= 80) return 'warning';
    return '';
  };

  const formatearCantidad = (registro) => {
    const alimento = alimentos.find(a => a.id === registro.alimento_id);
    if (!alimento) return registro.cantidad;
    
    const pesoPorcion = alimento.peso_porcion || 100;
    const porciones = registro.cantidad / pesoPorcion;
    
    // Si es muy cercano a un número entero, mostrar como porción
    if (Math.abs(porciones - Math.round(porciones)) < 0.01) {
      return `${Math.round(porciones)} porción${Math.round(porciones) !== 1 ? 'es' : ''}`;
    }
    // Si no, mostrar en gramos
    return `${registro.cantidad.toFixed(1)}g`;
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Registro Diario</h2>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ padding: '8px', fontSize: '14px' }}
          />
        </div>

        {/* Resumen del día */}
        {resumen.total_dia && (
          <div className="card" style={{ background: '#f0f7ff', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Resumen del Día</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Calorías</div>
                <div className={`stat-value ${getProgressColor(calcularPorcentaje(resumen.total_dia.total_calorias || 0, limites.limite_calorias))}`}>
                  {formatNutrient(resumen.total_dia.total_calorias || 0)} / {limites.limite_calorias}
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getProgressColor(calcularPorcentaje(resumen.total_dia.total_calorias || 0, limites.limite_calorias))}`}
                    style={{ width: `${calcularPorcentaje(resumen.total_dia.total_calorias || 0, limites.limite_calorias)}%` }}
                  />
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Grasas (g)</div>
                <div className={`stat-value ${getProgressColor(calcularPorcentaje(resumen.total_dia.total_grasas || 0, limites.limite_grasas))}`}>
                  {formatNutrient(resumen.total_dia.total_grasas || 0)} / {limites.limite_grasas}
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getProgressColor(calcularPorcentaje(resumen.total_dia.total_grasas || 0, limites.limite_grasas))}`}
                    style={{ width: `${calcularPorcentaje(resumen.total_dia.total_grasas || 0, limites.limite_grasas)}%` }}
                  />
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Carbohidratos (g)</div>
                <div className={`stat-value ${getProgressColor(calcularPorcentaje(resumen.total_dia.total_carbohidratos || 0, limites.limite_carbohidratos))}`}>
                  {formatNutrient(resumen.total_dia.total_carbohidratos || 0)} / {limites.limite_carbohidratos}
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getProgressColor(calcularPorcentaje(resumen.total_dia.total_carbohidratos || 0, limites.limite_carbohidratos))}`}
                    style={{ width: `${calcularPorcentaje(resumen.total_dia.total_carbohidratos || 0, limites.limite_carbohidratos)}%` }}
                  />
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Proteínas (g)</div>
                <div className={`stat-value ${getProgressColor(calcularPorcentaje(resumen.total_dia.total_proteinas || 0, limites.limite_proteinas))}`}>
                  {formatNutrient(resumen.total_dia.total_proteinas || 0)} / {limites.limite_proteinas}
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${getProgressColor(calcularPorcentaje(resumen.total_dia.total_proteinas || 0, limites.limite_proteinas))}`}
                    style={{ width: `${calcularPorcentaje(resumen.total_dia.total_proteinas || 0, limites.limite_proteinas)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Secciones de comidas */}
        {TIPOS_COMIDA.map(tipoComida => {
          const registrosComida = getRegistrosPorComida(tipoComida.id);
          const resumenComida = getResumenPorComida(tipoComida.id);
          
          return (
            <div key={tipoComida.id} className="meal-section">
              <div className="meal-header">
                <div>
                  <span style={{ fontSize: '24px', marginRight: '10px' }}>{tipoComida.icon}</span>
                  <span className="meal-title">{tipoComida.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAgregarAlimento(tipoComida.id)}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    + Alimento
                  </button>
                  {comidas.length > 0 && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAgregarComida(tipoComida.id)}
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      + Comida Completa
                    </button>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setTipoComidaSeleccionado(tipoComida.id);
                      setShowAsistenteModal(true);
                    }}
                    style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#9c27b0' }}
                  >
                    🤖 Asistente IA
                  </button>
                </div>
              </div>

              {/* Estadísticas de la comida */}
              <div className="stats-grid" style={{ marginBottom: '15px' }}>
                <div className="stat-item">
                  <div className="stat-label">Calorías</div>
                  <div className={`stat-value ${getProgressColor(calcularPorcentaje(resumenComida.total_calorias, limites.limite_calorias / 4))}`}>
                    {formatNutrient(resumenComida.total_calorias)}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Grasas (g)</div>
                  <div className={`stat-value ${getProgressColor(calcularPorcentaje(resumenComida.total_grasas, limites.limite_grasas / 4))}`}>
                    {formatNutrient(resumenComida.total_grasas)}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Carbohidratos (g)</div>
                  <div className={`stat-value ${getProgressColor(calcularPorcentaje(resumenComida.total_carbohidratos, limites.limite_carbohidratos / 4))}`}>
                    {formatNutrient(resumenComida.total_carbohidratos)}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Proteínas (g)</div>
                  <div className={`stat-value ${getProgressColor(calcularPorcentaje(resumenComida.total_proteinas, limites.limite_proteinas / 4))}`}>
                    {formatNutrient(resumenComida.total_proteinas)}
                  </div>
                </div>
              </div>

              {/* Lista de alimentos */}
              {registrosComida.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                  No hay alimentos registrados para esta comida
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Alimento</th>
                      <th>Cantidad</th>
                      <th>Calorías</th>
                      <th>Grasas</th>
                      <th>Carbohidratos</th>
                      <th>Proteínas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosComida.map(registro => (
                      <tr key={registro.id}>
                        <td>{registro.nombre}</td>
                        <td>{formatearCantidad(registro)}</td>
                        <td>{formatNutrient(registro.calorias)}</td>
                        <td>{formatNutrient(registro.grasas || 0)}</td>
                        <td>{formatNutrient(registro.carbohidratos || 0)}</td>
                        <td>{formatNutrient(registro.proteinas || 0)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleEditarRegistro(registro)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              title="Editar cantidad"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleEliminarRegistro(registro.id)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              title="Eliminar"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal para agregar alimento */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar Alimento - {TIPOS_COMIDA.find(t => t.id === tipoComidaSeleccionado)?.label}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Alimento *</label>
                <BuscadorAlimentos
                  alimentos={alimentos}
                  value={formData.alimento_id}
                  onChange={(e) => setFormData({ ...formData, alimento_id: e.target.value })}
                  placeholder="Buscar alimento..."
                  required
                />
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Escribe para buscar en tu lista de alimentos
                </small>
              </div>

              <div className="form-group">
                <label>Modo de cantidad</label>
                <select
                  name="modo_cantidad"
                  value={formData.modo_cantidad}
                  onChange={(e) => setFormData({ ...formData, modo_cantidad: e.target.value, cantidad: '' })}
                >
                  <option value="porcion">Por porciones (ej: 0.5, 1, 2)</option>
                  <option value="peso">Por peso en gramos</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  {formData.modo_cantidad === 'porcion' 
                    ? 'Cantidad de porciones (ej: 0.5 para media porción, 1 para una porción completa) *'
                    : 'Peso en gramos *'}
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  step="0.1"
                  min="0"
                  required
                  placeholder={formData.modo_cantidad === 'porcion' ? 'Ej: 0.5, 1, 2' : 'Ej: 50, 100, 150'}
                />
                {formData.alimento_id && formData.cantidad && (
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    {(() => {
                      const alimento = alimentos.find(a => a.id === parseInt(formData.alimento_id));
                      if (!alimento) return '';
                      
                      let cantidadFinal = parseFloat(formData.cantidad);
                      if (formData.modo_cantidad === 'porcion') {
                        cantidadFinal = cantidadFinal * (alimento.peso_porcion || 100);
                      }
                      
                      const factor = cantidadFinal / (alimento.peso_porcion || 100);
                      const calorias = alimento.calorias * factor;
                      const grasas = (alimento.grasas || 0) * factor;
                      const carbohidratos = (alimento.carbohidratos || 0) * factor;
                      const proteinas = (alimento.proteinas || 0) * factor;
                      
                      return `Aproximadamente: ${formatNutrient(calorias)} cal, ${formatNutrient(grasas)}g grasas, ${formatNutrient(carbohidratos)}g carbohidratos, ${formatNutrient(proteinas)}g proteínas`;
                    })()}
                  </small>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  Agregar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para agregar comida completa */}
      {showComidaModal && (
        <div className="modal" onClick={() => setShowComidaModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar Comida Completa - {TIPOS_COMIDA.find(t => t.id === tipoComidaSeleccionado)?.label}</h2>
              <button className="close-btn" onClick={() => setShowComidaModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitComida}>
              <div className="form-group">
                <label>Selecciona una comida *</label>
                <select
                  name="comida_id"
                  value={comidaSeleccionada}
                  onChange={(e) => setComidaSeleccionada(e.target.value)}
                  required
                >
                  <option value="">Selecciona una comida</option>
                  {comidas.map(comida => (
                    <option key={comida.id} value={comida.id}>
                      {comida.nombre}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Se agregarán todos los alimentos de esta comida al registro
                </small>
              </div>

              {comidaSeleccionada && (() => {
                const comida = comidas.find(c => c.id === parseInt(comidaSeleccionada));
                return comida ? (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}>
                    <strong>Comida seleccionada:</strong> {comida.nombre}
                    {comida.descripcion && <div style={{ marginTop: '5px', color: '#666' }}>{comida.descripcion}</div>}
                  </div>
                ) : null;
              })()}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  Agregar Comida
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowComidaModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal del Asistente IA */}
      {showAsistenteModal && (
        <AsistenteIA
          alimentos={alimentos}
          fecha={fecha}
          tipoComida={tipoComidaSeleccionado}
          onAgregarAlimento={() => {
            fetchRegistros();
            setShowAsistenteModal(false);
          }}
          onClose={() => setShowAsistenteModal(false)}
        />
      )}

      {/* Modal para editar registro */}
      {showEditModal && registroEditando && (
        <div className="modal" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Cantidad - {registroEditando.nombre}</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleActualizarRegistro}>
              <div className="form-group">
                <label>Modo de cantidad</label>
                <select
                  name="modo_cantidad"
                  value={editFormData.modo_cantidad}
                  onChange={(e) => {
                    const nuevoModo = e.target.value;
                    const alimento = alimentos.find(a => a.id === registroEditando.alimento_id);
                    if (alimento) {
                      // Convertir entre modos
                      let nuevaCantidad = editFormData.cantidad;
                      if (nuevoModo === 'porcion' && editFormData.modo_cantidad === 'peso') {
                        // De peso a porción
                        nuevaCantidad = (parseFloat(editFormData.cantidad) / (alimento.peso_porcion || 100)).toFixed(2);
                      } else if (nuevoModo === 'peso' && editFormData.modo_cantidad === 'porcion') {
                        // De porción a peso
                        nuevaCantidad = (parseFloat(editFormData.cantidad) * (alimento.peso_porcion || 100)).toFixed(1);
                      }
                      setEditFormData({ ...editFormData, modo_cantidad: nuevoModo, cantidad: nuevaCantidad });
                    } else {
                      setEditFormData({ ...editFormData, modo_cantidad: nuevoModo });
                    }
                  }}
                >
                  <option value="porcion">Por porciones (ej: 0.5, 1, 2)</option>
                  <option value="peso">Por peso en gramos</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  {editFormData.modo_cantidad === 'porcion' 
                    ? 'Cantidad de porciones *'
                    : 'Peso en gramos *'}
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={editFormData.cantidad}
                  onChange={(e) => setEditFormData({ ...editFormData, cantidad: e.target.value })}
                  step={editFormData.modo_cantidad === 'porcion' ? '0.1' : '1'}
                  min="0"
                  required
                  placeholder={editFormData.modo_cantidad === 'porcion' ? 'Ej: 0.5, 1, 2' : 'Ej: 50, 100, 150'}
                />
                {editFormData.cantidad && (() => {
                  const alimento = alimentos.find(a => a.id === registroEditando.alimento_id);
                  if (!alimento) return null;
                  
                  let cantidadFinal = parseFloat(editFormData.cantidad);
                  if (editFormData.modo_cantidad === 'porcion') {
                    cantidadFinal = cantidadFinal * (alimento.peso_porcion || 100);
                  }
                  
                  const factor = cantidadFinal / (alimento.peso_porcion || 100);
                  const calorias = alimento.calorias * factor;
                  const grasas = (alimento.grasas || 0) * factor;
                  const carbohidratos = (alimento.carbohidratos || 0) * factor;
                  const proteinas = (alimento.proteinas || 0) * factor;
                  
                  return (
                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                      Nuevos valores: {formatNutrient(calorias)} cal, {formatNutrient(grasas)}g grasas, {formatNutrient(carbohidratos)}g carbohidratos, {formatNutrient(proteinas)}g proteínas
                    </small>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  Actualizar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setRegistroEditando(null);
                    setEditFormData({ cantidad: '', modo_cantidad: 'peso' });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroDiario;

