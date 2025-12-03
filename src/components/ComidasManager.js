import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { formatNutrient } from '../utils';
import BuscadorAlimentos from './BuscadorAlimentos';

const API_URL = config.API_URL;

const ComidasManager = () => {
  const [comidas, setComidas] = useState([]);
  const [alimentos, setAlimentos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showAlimentoModal, setShowAlimentoModal] = useState(false);
  const [editingComida, setEditingComida] = useState(null);
  const [comidaDetalle, setComidaDetalle] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const [alimentoForm, setAlimentoForm] = useState({
    alimento_id: '',
    cantidad: '',
    modo_cantidad: 'porcion'
  });
  const [nuevoAlimentoForm, setNuevoAlimentoForm] = useState({
    nombre: '',
    calorias: '',
    grasas: '',
    carbohidratos: '',
    proteinas: '',
    sodio: '',
    peso_porcion: 100
  });

  useEffect(() => {
    fetchComidas();
    fetchAlimentos();
  }, []);

  const fetchComidas = async () => {
    try {
      const response = await axios.get(`${API_URL}/comidas`);
      setComidas(response.data);
    } catch (error) {
      console.error('Error cargando comidas:', error);
      alert('Error al cargar las comidas');
    }
  };

  const fetchAlimentos = async () => {
    try {
      const response = await axios.get(`${API_URL}/alimentos`);
      setAlimentos(response.data);
    } catch (error) {
      console.error('Error cargando alimentos:', error);
    }
  };

  const fetchComidaDetalle = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/comidas/${id}`);
      setComidaDetalle(response.data);
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error cargando detalle de comida:', error);
      alert('Error al cargar los detalles de la comida');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAlimentoInputChange = (e) => {
    const { name, value } = e.target;
    setAlimentoForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let comidaId;
      if (editingComida) {
        await axios.put(`${API_URL}/comidas/${editingComida.id}`, formData);
        comidaId = editingComida.id;
      } else {
        const response = await axios.post(`${API_URL}/comidas`, formData);
        comidaId = response.data.id;
      }
      fetchComidas();
      resetForm();
      setShowModal(false);
      
      // Si es una comida nueva, abrir el modal de detalle para agregar alimentos
      if (!editingComida && comidaId) {
        await fetchComidaDetalle(comidaId);
      }
    } catch (error) {
      console.error('Error guardando comida:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`Error al guardar la comida: ${errorMessage}`);
    }
  };

  const handleAgregarAlimento = async (e) => {
    e.preventDefault();
    if (!comidaDetalle) return;

    try {
      const cantidadNum = parseFloat(alimentoForm.cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
      }

      await axios.post(`${API_URL}/comidas/${comidaDetalle.id}/alimentos`, {
        alimento_id: parseInt(alimentoForm.alimento_id),
        cantidad: cantidadNum,
        modo_cantidad: alimentoForm.modo_cantidad
      });

      fetchComidaDetalle(comidaDetalle.id);
      setAlimentoForm({ alimento_id: '', cantidad: '', modo_cantidad: 'porcion' });
    } catch (error) {
      console.error('Error agregando alimento:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`Error al agregar el alimento: ${errorMessage}`);
    }
  };

  const handleEliminarAlimento = async (alimentoId) => {
    if (!comidaDetalle) return;
    if (!window.confirm('¿Estás seguro de eliminar este alimento de la comida?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/comidas/${comidaDetalle.id}/alimentos/${alimentoId}`);
      fetchComidaDetalle(comidaDetalle.id);
    } catch (error) {
      console.error('Error eliminando alimento:', error);
      alert('Error al eliminar el alimento');
    }
  };

  const handleEdit = (comida) => {
    setEditingComida(comida);
    setFormData({
      nombre: comida.nombre,
      descripcion: comida.descripcion || ''
    });
    setShowDetalleModal(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta comida? Se eliminarán todos sus alimentos.')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/comidas/${id}`);
      fetchComidas();
    } catch (error) {
      console.error('Error eliminando comida:', error);
      alert('Error al eliminar la comida');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: ''
    });
    setEditingComida(null);
  };

  const handleNuevoAlimentoInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoAlimentoForm(prev => ({
      ...prev,
      [name]: value === '' ? '' : (name === 'nombre' ? value : parseFloat(value))
    }));
  };

  const handleCrearAlimento = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        nombre: nuevoAlimentoForm.nombre,
        calorias: nuevoAlimentoForm.calorias === '' || isNaN(nuevoAlimentoForm.calorias) ? 0 : parseFloat(nuevoAlimentoForm.calorias),
        grasas: nuevoAlimentoForm.grasas === '' || isNaN(nuevoAlimentoForm.grasas) ? 0 : parseFloat(nuevoAlimentoForm.grasas),
        carbohidratos: nuevoAlimentoForm.carbohidratos === '' || isNaN(nuevoAlimentoForm.carbohidratos) ? 0 : parseFloat(nuevoAlimentoForm.carbohidratos),
        proteinas: nuevoAlimentoForm.proteinas === '' || isNaN(nuevoAlimentoForm.proteinas) ? 0 : parseFloat(nuevoAlimentoForm.proteinas),
        sodio: nuevoAlimentoForm.sodio === '' || isNaN(nuevoAlimentoForm.sodio) ? 0 : parseFloat(nuevoAlimentoForm.sodio),
        peso_porcion: nuevoAlimentoForm.peso_porcion === '' || isNaN(nuevoAlimentoForm.peso_porcion) ? 100 : parseFloat(nuevoAlimentoForm.peso_porcion)
      };

      const response = await axios.post(`${API_URL}/alimentos`, dataToSend);
      
      // Actualizar la lista de alimentos
      await fetchAlimentos();
      
      // Seleccionar automáticamente el alimento recién creado
      setAlimentoForm(prev => ({
        ...prev,
        alimento_id: response.data.id.toString()
      }));
      
      // Cerrar el modal de crear alimento
      setShowAlimentoModal(false);
      
      // Resetear el formulario
      setNuevoAlimentoForm({
        nombre: '',
        calorias: '',
        grasas: '',
        carbohidratos: '',
        proteinas: '',
        sodio: '',
        peso_porcion: 100
      });
    } catch (error) {
      console.error('Error creando alimento:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`Error al crear el alimento: ${errorMessage}`);
    }
  };

  const resetNuevoAlimentoForm = () => {
    setNuevoAlimentoForm({
      nombre: '',
      calorias: '',
      grasas: '',
      carbohidratos: '',
      proteinas: '',
      sodio: '',
      peso_porcion: 100
    });
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Mis Comidas</h2>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Crear Comida
          </button>
        </div>

        {comidas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No tienes comidas guardadas. Crea tu primera comida para comenzar.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {comidas.map(comida => (
              <div key={comida.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px',
                backgroundColor: '#f9f9f9'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px' }}>{comida.nombre}</h3>
                {comida.descripcion && (
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                    {comida.descripcion}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => fetchComidaDetalle(comida.id)}
                    style={{ flex: 1, padding: '8px', fontSize: '14px' }}
                  >
                    Ver/Editar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(comida.id)}
                    style={{ padding: '8px 15px', fontSize: '14px' }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear/editar comida */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingComida ? 'Editar Comida' : 'Nueva Comida'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de la Comida *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Desayuno Completo"
                />
              </div>
              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Descripción de la comida..."
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  {editingComida ? 'Actualizar' : 'Crear'}
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

      {/* Modal para ver/editar detalle de comida */}
      {showDetalleModal && comidaDetalle && (
        <div className="modal" onClick={() => setShowDetalleModal(false)}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{comidaDetalle.nombre}</h2>
              <button className="close-btn" onClick={() => setShowDetalleModal(false)}>×</button>
            </div>

            {comidaDetalle.descripcion && (
              <p style={{ color: '#666', marginBottom: '20px' }}>{comidaDetalle.descripcion}</p>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h3>Macronutrientes Totales:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                  <strong>Calorías:</strong> {formatNutrient(comidaDetalle.totales?.calorias || 0)}
                </div>
                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                  <strong>Grasas:</strong> {formatNutrient(comidaDetalle.totales?.grasas || 0)} g
                </div>
                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                  <strong>Carbohidratos:</strong> {formatNutrient(comidaDetalle.totales?.carbohidratos || 0)} g
                </div>
                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                  <strong>Proteínas:</strong> {formatNutrient(comidaDetalle.totales?.proteinas || 0)} g
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>Alimentos en esta comida:</h3>
              {comidaDetalle.alimentos && comidaDetalle.alimentos.length > 0 ? (
                <table style={{ width: '100%', marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th>Alimento</th>
                      <th>Cantidad</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comidaDetalle.alimentos.map(item => (
                      <tr key={item.alimento_id}>
                        <td>{item.nombre}</td>
                        <td>
                          {item.modo_cantidad === 'porcion' 
                            ? `${item.cantidad} porción(es)`
                            : `${item.cantidad} g`}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleEliminarAlimento(item.alimento_id)}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No hay alimentos en esta comida aún.</p>
              )}
            </div>

            <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
              <h3>Agregar Alimento:</h3>
              <form onSubmit={handleAgregarAlimento}>
                <div className="form-group">
                  <label>Alimento</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <BuscadorAlimentos
                        alimentos={alimentos}
                        value={alimentoForm.alimento_id}
                        onChange={handleAlimentoInputChange}
                        placeholder="Buscar alimento..."
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAlimentoModal(true)}
                      style={{ whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
                    >
                      + Crear Nuevo
                    </button>
                  </div>
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    Escribe para buscar o crea uno nuevo
                  </small>
                </div>
                <div className="form-group">
                  <label>Modo de cantidad</label>
                  <select
                    name="modo_cantidad"
                    value={alimentoForm.modo_cantidad}
                    onChange={handleAlimentoInputChange}
                  >
                    <option value="porcion">Por porción</option>
                    <option value="peso">Por peso (gramos)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    name="cantidad"
                    value={alimentoForm.cantidad}
                    onChange={handleAlimentoInputChange}
                    step="0.1"
                    required
                    placeholder={alimentoForm.modo_cantidad === 'porcion' ? 'Ej: 1, 0.5, 2' : 'Ej: 100, 50'}
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Agregar Alimento
                </button>
              </form>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleEdit(comidaDetalle)}
              >
                Editar Nombre/Descripción
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetalleModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo alimento */}
      {showAlimentoModal && (
        <div className="modal" onClick={() => {
          setShowAlimentoModal(false);
          resetNuevoAlimentoForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nuevo Alimento</h2>
              <button className="close-btn" onClick={() => {
                setShowAlimentoModal(false);
                resetNuevoAlimentoForm();
              }}>×</button>
            </div>
            <form onSubmit={handleCrearAlimento}>
              <div className="form-group">
                <label>Nombre del Alimento *</label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevoAlimentoForm.nombre}
                  onChange={handleNuevoAlimentoInputChange}
                  required
                  placeholder="Ej: Pan integral"
                />
              </div>
              <div className="form-group">
                <label>Calorías por porción *</label>
                <input
                  type="number"
                  name="calorias"
                  value={nuevoAlimentoForm.calorias}
                  onChange={handleNuevoAlimentoInputChange}
                  step="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Grasas (g)</label>
                <input
                  type="number"
                  name="grasas"
                  value={nuevoAlimentoForm.grasas}
                  onChange={handleNuevoAlimentoInputChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Carbohidratos (g)</label>
                <input
                  type="number"
                  name="carbohidratos"
                  value={nuevoAlimentoForm.carbohidratos}
                  onChange={handleNuevoAlimentoInputChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Proteínas (g)</label>
                <input
                  type="number"
                  name="proteinas"
                  value={nuevoAlimentoForm.proteinas}
                  onChange={handleNuevoAlimentoInputChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Sodio (mg)</label>
                <input
                  type="number"
                  name="sodio"
                  value={nuevoAlimentoForm.sodio}
                  onChange={handleNuevoAlimentoInputChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Peso de la porción (g) - Por defecto 100g</label>
                <input
                  type="number"
                  name="peso_porcion"
                  value={nuevoAlimentoForm.peso_porcion}
                  onChange={handleNuevoAlimentoInputChange}
                  step="0.1"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  Crear y Seleccionar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAlimentoModal(false);
                    resetNuevoAlimentoForm();
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

export default ComidasManager;

