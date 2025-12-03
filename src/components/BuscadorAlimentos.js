import React, { useState, useRef, useEffect } from 'react';
import { formatNutrient } from '../utils';

const BuscadorAlimentos = ({ alimentos, value, onChange, onSelect, placeholder = "Buscar alimento...", required = false }) => {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [alimentoSeleccionado, setAlimentoSeleccionado] = useState(null);
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Si hay un valor inicial, buscar el alimento correspondiente
    if (value) {
      const alimento = alimentos.find(a => a.id === parseInt(value));
      if (alimento) {
        setAlimentoSeleccionado(alimento);
        setBusqueda(alimento.nombre);
      }
    } else {
      setAlimentoSeleccionado(null);
      setBusqueda('');
    }
  }, [value, alimentos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const alimentosFiltrados = alimentos.filter(alimento =>
    alimento.nombre.toLowerCase().includes(busqueda.toLowerCase())
  ).slice(0, 10); // Limitar a 10 resultados

  const handleInputChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    setMostrarSugerencias(true);
    setAlimentoSeleccionado(null);
    
    if (onChange) {
      onChange({ target: { name: 'alimento_id', value: '' } });
    }
  };

  const handleSeleccionar = (alimento) => {
    setBusqueda(alimento.nombre);
    setAlimentoSeleccionado(alimento);
    setMostrarSugerencias(false);
    
    if (onChange) {
      onChange({ target: { name: 'alimento_id', value: alimento.id.toString() } });
    }
    
    if (onSelect) {
      onSelect(alimento);
    }
    
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    if (busqueda) {
      setMostrarSugerencias(true);
    }
  };

  return (
    <div ref={contenedorRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={busqueda}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      />
      
      {mostrarSugerencias && busqueda && alimentosFiltrados.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '4px'
          }}
        >
          {alimentosFiltrados.map(alimento => (
            <div
              key={alimento.id}
              onClick={() => handleSeleccionar(alimento)}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {alimento.nombre}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {alimento.calorias} cal por {alimento.peso_porcion || 100}g
                {alimento.grasas > 0 && ` • ${formatNutrient(alimento.grasas)}g grasas`}
                {alimento.proteinas > 0 && ` • ${formatNutrient(alimento.proteinas)}g proteínas`}
              </div>
            </div>
          ))}
          
          {alimentosFiltrados.length === 0 && busqueda && (
            <div style={{ padding: '12px', color: '#666', fontStyle: 'italic' }}>
              No se encontraron alimentos
            </div>
          )}
        </div>
      )}
      
      {/* Input hidden para validación del formulario */}
      <input
        type="hidden"
        name="alimento_id"
        value={alimentoSeleccionado?.id || value || ''}
        required={required}
      />
    </div>
  );
};

export default BuscadorAlimentos;

