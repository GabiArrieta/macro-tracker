import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { formatNutrient } from '../utils';

const API_URL = config.API_URL;

const AlimentosManager = () => {
  const [alimentos, setAlimentos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAlimento, setEditingAlimento] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    calorias: '',
    grasas: '',
    carbohidratos: '',
    proteinas: '',
    sodio: '',
    peso_porcion: 100
  });

  useEffect(() => {
    fetchAlimentos();
  }, []);

  const fetchAlimentos = async () => {
    try {
      const response = await axios.get(`${API_URL}/alimentos`);
      setAlimentos(response.data);
    } catch (error) {
      console.error('Error cargando alimentos:', error);
      alert('Error al cargar los alimentos');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : (name === 'nombre' ? value : parseFloat(value))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Preparar los datos para enviar, convirtiendo valores vacíos a 0 o null según corresponda
      const dataToSend = {
        nombre: formData.nombre,
        calorias: formData.calorias === '' || isNaN(formData.calorias) ? 0 : parseFloat(formData.calorias),
        grasas: formData.grasas === '' || isNaN(formData.grasas) ? 0 : parseFloat(formData.grasas),
        carbohidratos: formData.carbohidratos === '' || isNaN(formData.carbohidratos) ? 0 : parseFloat(formData.carbohidratos),
        proteinas: formData.proteinas === '' || isNaN(formData.proteinas) ? 0 : parseFloat(formData.proteinas),
        sodio: formData.sodio === '' || isNaN(formData.sodio) ? 0 : parseFloat(formData.sodio),
        peso_porcion: formData.peso_porcion === '' || isNaN(formData.peso_porcion) ? 100 : parseFloat(formData.peso_porcion)
      };

      if (editingAlimento) {
        await axios.put(`${API_URL}/alimentos/${editingAlimento.id}`, dataToSend);
      } else {
        await axios.post(`${API_URL}/alimentos`, dataToSend);
      }
      fetchAlimentos();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error guardando alimento:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`Error al guardar el alimento: ${errorMessage}`);
    }
  };

  const handleEdit = (alimento) => {
    setEditingAlimento(alimento);
    setFormData({
      nombre: alimento.nombre,
      calorias: alimento.calorias,
      grasas: alimento.grasas || '',
      carbohidratos: alimento.carbohidratos || '',
      proteinas: alimento.proteinas || '',
      sodio: alimento.sodio || '',
      peso_porcion: alimento.peso_porcion || 100
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este alimento?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/alimentos/${id}`);
      fetchAlimentos();
    } catch (error) {
      console.error('Error eliminando alimento:', error);
      alert('Error al eliminar el alimento');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      calorias: '',
      grasas: '',
      carbohidratos: '',
      proteinas: '',
      sodio: '',
      peso_porcion: 100
    });
    setEditingAlimento(null);
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Mis Alimentos</h2>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Agregar Alimento
          </button>
        </div>

        {alimentos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No tienes alimentos guardados. Agrega tu primer alimento para comenzar.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Calorías</th>
                <th>Grasas (g)</th>
                <th>Carbohidratos (g)</th>
                <th>Proteínas (g)</th>
                <th>Sodio (mg)</th>
                <th>Porción (g)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alimentos.map(alimento => (
                <tr key={alimento.id}>
                  <td>{alimento.nombre}</td>
                  <td>{formatNutrient(alimento.calorias)}</td>
                  <td>{formatNutrient(alimento.grasas || 0)}</td>
                  <td>{formatNutrient(alimento.carbohidratos || 0)}</td>
                  <td>{formatNutrient(alimento.proteinas || 0)}</td>
                  <td>{formatNutrient(alimento.sodio || 0)}</td>
                  <td>{formatNutrient(alimento.peso_porcion || 100)}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(alimento)}
                      style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(alimento.id)}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAlimento ? 'Editar Alimento' : 'Nuevo Alimento'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre del Alimento *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Calorías por porción *</label>
                <input
                  type="number"
                  name="calorias"
                  value={formData.calorias}
                  onChange={handleInputChange}
                  step="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Grasas (g)</label>
                <input
                  type="number"
                  name="grasas"
                  value={formData.grasas}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Carbohidratos (g)</label>
                <input
                  type="number"
                  name="carbohidratos"
                  value={formData.carbohidratos}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Proteínas (g)</label>
                <input
                  type="number"
                  name="proteinas"
                  value={formData.proteinas}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Sodio (mg)</label>
                <input
                  type="number"
                  name="sodio"
                  value={formData.sodio}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Peso de la porción (g) - Por defecto 100g</label>
                <input
                  type="number"
                  name="peso_porcion"
                  value={formData.peso_porcion}
                  onChange={handleInputChange}
                  step="0.1"
                />
                <small style={{ color: '#666' }}>
                  Este es el peso base para los cálculos. Si comes 0.5 porciones o un peso específico, se calculará automáticamente.
                </small>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  {editingAlimento ? 'Actualizar' : 'Guardar'}
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
    </div>
  );
};

export default AlimentosManager;

