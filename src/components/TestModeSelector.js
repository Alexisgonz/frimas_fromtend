import React, { useState, useEffect } from 'react';
import mondayService from '../services/mondayService';
import './TestModeSelector.css';

const TestModeSelector = ({ onItemSelect, currentContext }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTestItems();
  }, []);

  const loadTestItems = async () => {
    try {
      setLoading(true);
      const itemList = await mondayService.listTestItems();
      setItems(itemList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentContext?.isTestMode) {
    return null;
  }

  return (
    <div className="test-mode-selector">
      <div className="test-mode-header">
        <h3>🧪 Modo de Pruebas - Selector de Ítem</h3>
        <p>
          {currentContext.isMockMode 
            ? 'Usando datos mock para desarrollo local'
            : `Conectado al tablero Monday: ${currentContext.boardId}`
          }
        </p>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando ítems del tablero...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <h4>Error al cargar ítems</h4>
          <p>{error}</p>
          <button onClick={loadTestItems} className="retry-button">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="items-selector">
          <label htmlFor="item-select">Seleccionar ítem para probar:</label>
          <select
            id="item-select"
            value={currentContext.itemId}
            onChange={(e) => onItemSelect(e.target.value)}
            className="item-select"
          >
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} (ID: {item.id})
              </option>
            ))}
          </select>
          
          <div className="current-item-info">
            <strong>Ítem actual:</strong> {currentContext.itemId}
          </div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="no-items">
          <p>No se encontraron ítems en el tablero de pruebas.</p>
          <p>Asegúrese de que el tablero {currentContext.boardId} tenga ítems.</p>
        </div>
      )}
    </div>
  );
};

export default TestModeSelector;
