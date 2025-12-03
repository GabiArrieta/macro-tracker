import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

const LimitesConfig = ({ limites, onUpdate }) => {
  const [formData, setFormData] = useState({
    limite_calorias: limites.limite_calorias || 2000,
    limite_grasas: limites.limite_grasas || 65,
    limite_carbohidratos: limites.limite_carbohidratos || 300,
    limite_proteinas: limites.limite_proteinas || 150
  });

  useEffect(() => {
    setFormData({
      limite_calorias: limites.limite_calorias || 2000,
      limite_grasas: limites.limite_grasas || 65,
      limite_carbohidratos: limites.limite_carbohidratos || 300,
      limite_proteinas: limites.limite_proteinas || 150
    });
  }, [limites]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/limites`, formData);
      alert('Límites actualizados correctamente');
      onUpdate();
    } catch (error) {
      console.error('Error actualizando límites:', error);
      alert('Error al actualizar los límites');
    }
  };

  return (
    <div className="card">
      <h2>Configurar Límites Diarios</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Establece tus límites diarios de macronutrientes y calorías. Estos límites se usarán para mostrar tu progreso durante el día.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div className="form-group">
            <label>Límite de Calorías (kcal) *</label>
            <input
              type="number"
              name="limite_calorias"
              value={formData.limite_calorias}
              onChange={handleInputChange}
              min="0"
              step="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Límite de Grasas (g) *</label>
            <input
              type="number"
              name="limite_grasas"
              value={formData.limite_grasas}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label>Límite de Carbohidratos (g) *</label>
            <input
              type="number"
              name="limite_carbohidratos"
              value={formData.limite_carbohidratos}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label>Límite de Proteínas (g) *</label>
            <input
              type="number"
              name="limite_proteinas"
              value={formData.limite_proteinas}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary">
            Guardar Límites
          </button>
        </div>
      </form>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f0f7ff', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px' }}>💡 Consejos</h3>
        <ul style={{ color: '#666', lineHeight: '1.8' }}>
          <li>Los límites recomendados varían según tu edad, género, peso y nivel de actividad.</li>
          <li>Una dieta típica puede tener: 45-65% carbohidratos, 20-35% grasas, 10-35% proteínas.</li>
          <li>Puedes ajustar estos límites según tus objetivos personales (pérdida de peso, ganancia muscular, etc.).</li>
        </ul>
      </div>
    </div>
  );
};

export default LimitesConfig;

