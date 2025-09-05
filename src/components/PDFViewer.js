import React from 'react';
import './PDFViewer.css';

const PDFViewer = ({ 
  pdfUrl, 
  templateName = 'Documento',
  onLoadError,
  onLoadSuccess 
}) => {

  if (!pdfUrl) {
    return (
      <div className="pdf-viewer">
        <div className="pdf-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">📄</div>
            <h4>Previsualización del Documento</h4>
            <p>Seleccione una plantilla para ver la previsualización</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-header">
        <h4>Previsualización: {templateName}</h4>
        <div className="pdf-controls">
          <div className="pdf-info-text">
            <span>📋 Vista previa del documento PDF</span>
          </div>
        </div>
      </div>

      <div className="pdf-content">
        <div className="pdf-iframe-container">
          <iframe
            src={pdfUrl}
            title={`Previsualización: ${templateName}`}
            className="pdf-iframe"
            onLoad={() => {
              if (onLoadSuccess) {
                onLoadSuccess({ numPages: 'N/A' });
              }
            }}
            onError={(error) => {
              console.error('Error loading PDF:', error);
              if (onLoadError) {
                onLoadError(error);
              }
            }}
          />
        </div>
      </div>

      <div className="pdf-info">
        <small>
          📋 Esta es una previsualización del documento. Los campos de firma y formularios 
          no son interactivos en esta vista.
        </small>
      </div>
    </div>
  );
};

export default PDFViewer;
