import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import AlimentosManager from './components/AlimentosManager';
import RegistroDiario from './components/RegistroDiario';
import LimitesConfig from './components/LimitesConfig';
import ComidasManager from './components/ComidasManager';
import ChatbotFlotante from './components/ChatbotFlotante';
import config from './config';

const API_URL = config.API_URL;

function App() {
  const [activeTab, setActiveTab] = useState('registro');
  const [limites, setLimites] = useState({
    limite_calorias: 2000,
    limite_grasas: 65,
    limite_carbohidratos: 300,
    limite_proteinas: 150
  });
  const [alimentos, setAlimentos] = useState([]);
  const [comidas, setComidas] = useState([]);

  useEffect(() => {
    fetchLimites();
    fetchAlimentos();
    fetchComidas();
  }, []);

  const fetchLimites = async () => {
    try {
      const response = await axios.get(`${API_URL}/limites`);
      setLimites(response.data);
    } catch (error) {
      console.error('Error cargando límites:', error);
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

  const fetchComidas = async () => {
    try {
      const response = await axios.get(`${API_URL}/comidas`);
      setComidas(response.data);
    } catch (error) {
      console.error('Error cargando comidas:', error);
    }
  };

  const handleRefresh = () => {
    fetchAlimentos();
    fetchComidas();
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🍎 Tracker de Alimentos</h1>
        <p>Rastrea tus comidas y calorías diarias</p>
      </header>

      <div className="container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'registro' ? 'active' : ''}`}
            onClick={() => setActiveTab('registro')}
          >
            Registro Diario
          </button>
          <button
            className={`tab ${activeTab === 'alimentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('alimentos')}
          >
            Mis Alimentos
          </button>
          <button
            className={`tab ${activeTab === 'comidas' ? 'active' : ''}`}
            onClick={() => setActiveTab('comidas')}
          >
            Mis Comidas
          </button>
          <button
            className={`tab ${activeTab === 'limites' ? 'active' : ''}`}
            onClick={() => setActiveTab('limites')}
          >
            Límites
          </button>
        </div>

        {activeTab === 'registro' && (
          <RegistroDiario limites={limites} />
        )}

        {activeTab === 'alimentos' && (
          <AlimentosManager />
        )}

        {activeTab === 'comidas' && (
          <ComidasManager />
        )}

        {activeTab === 'limites' && (
          <LimitesConfig limites={limites} onUpdate={fetchLimites} />
        )}
      </div>

      {/* Chatbot Flotante */}
      <ChatbotFlotante
        alimentos={alimentos}
        comidas={comidas}
        fecha={new Date().toISOString().split('T')[0]}
        onAgregarAlimento={handleRefresh}
        onAgregarComida={handleRefresh}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

export default App;

