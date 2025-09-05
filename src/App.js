import React, { useState, useEffect, useCallback } from 'react';
import mondayService from './services/mondayService';
import docusealService from './services/docusealService';
import SignerMapper from './components/SignerMapper';
import PDFViewer from './components/PDFViewer';
import TestModeSelector from './components/TestModeSelector';
import DocumentProcessor from './components/DocumentProcessor';
import './App.css';

function App() {
  // Estados principales
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de Monday
  const [mondayContext, setMondayContext] = useState(null);
  const [mondayItemData, setMondayItemData] = useState(null);
  
  // Estados de DocuSeal
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDetails, setTemplateDetails] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Estados de mapeo y envío
  const [signerMapping, setSignerMapping] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Estados para DocumentProcessor
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [showDocumentProcessor, setShowDocumentProcessor] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Obtener contexto de Monday
      const context = await mondayService.getContext();
      setMondayContext(context);

      if (!context.itemId) {
        throw new Error('No se pudo obtener el ID del ítem. Asegúrese de que la aplicación esté abierta desde un ítem.');
      }

      // 2. Obtener datos del ítem
      const itemData = await mondayService.getItemData(context.itemId);
      setMondayItemData(itemData);

      // 3. Obtener plantillas de DocuSeal
      const templatesData = await docusealService.getTemplates();
      setTemplates(templatesData);

      // Mostrar notificación de éxito
      await mondayService.showNotification(
        `Aplicación cargada correctamente. Encontrados ${itemData.allContacts.length} contactos y ${templatesData.length} plantillas.`,
        'success'
      );

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.message);
      await mondayService.showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar selección de plantilla
  const handleTemplateSelection = async (templateId) => {
    if (!templateId) {
      setSelectedTemplate(null);
      setTemplateDetails(null);
      setPreviewUrl(null);
      setSignerMapping({});
      return;
    }

    try {
      setIsLoading(true);
      
      // Obtener detalles de la plantilla
      const details = await docusealService.getTemplateDetails(templateId);
      setTemplateDetails(details);
      
      // Obtener URL de previsualización
      const url = await docusealService.getTemplatePreviewURL(templateId);
      setPreviewUrl(url);
      
      // Encontrar la plantilla seleccionada
      const template = templates.find(t => t.id.toString() === templateId);
      setSelectedTemplate(template);
      
      // Resetear mapeo
      setSignerMapping({});
      
    } catch (err) {
      console.error('Error loading template details:', err);
      setError(err.message);
      await mondayService.showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambios en el mapeo de firmantes
  const handleMappingChange = useCallback((newMapping) => {
    setSignerMapping(newMapping);
  }, []);

  // Enviar solicitud de firma
  const handleSubmitSignature = async () => {
    if (!selectedTemplate || !templateDetails || Object.keys(signerMapping).length === 0) {
      await mondayService.showNotification('Por favor complete la selección de plantilla y asignación de firmantes', 'error');
      return;
    }

    // Validar que todos los roles estén asignados
    const requiredSubmitters = templateDetails.submitters || [];
    const missingRoles = requiredSubmitters.filter(submitter => !signerMapping[submitter.uuid]);
    
    if (missingRoles.length > 0) {
      await mondayService.showNotification(
        `Faltan asignaciones para ${missingRoles.length} rol(es). Complete todas las asignaciones antes de enviar.`,
        'error'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Construir datos de submisión
      const submissionData = {
        template_id: selectedTemplate.id,
        submitters: requiredSubmitters.map(submitter => ({
          name: signerMapping[submitter.uuid].name,
          email: signerMapping[submitter.uuid].email,
          role: submitter.name || submitter.uuid,
          uuid: submitter.uuid
        })),
        send_email: true,
        metadata: {
          monday_item_id: mondayContext.itemId,
          monday_board_id: mondayContext.boardId,
          monday_item_name: mondayItemData.name,
          template_name: selectedTemplate.name
        }
      };

      console.log('Submitting signature request:', submissionData);

      // Enviar a DocuSeal
      const result = await docusealService.createSubmission(submissionData);
      setSubmissionResult(result);

      // Mostrar éxito
      await mondayService.showNotification(
        `¡Solicitud de firma enviada exitosamente! ID: ${result.id}`,
        'success'
      );

      // Opcional: Actualizar una columna en Monday con el ID de la submisión
      // await mondayService.updateColumnValue(mondayContext.itemId, 'status', 'Enviado a firma');

    } catch (err) {
      console.error('Error submitting signature request:', err);
      setError(err.message);
      await mondayService.showNotification(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cambio de ítem en modo de pruebas
  const handleTestItemChange = async (newItemId) => {
    try {
      setIsLoading(true);
      
      // Actualizar contexto con nuevo ítem
      const newContext = { ...mondayContext, itemId: newItemId };
      setMondayContext(newContext);
      
      // Cargar datos del nuevo ítem
      const itemData = await mondayService.getItemData(newItemId);
      setMondayItemData(itemData);
      
      // Resetear selecciones
      setSelectedTemplate(null);
      setTemplateDetails(null);
      setPreviewUrl(null);
      setSignerMapping({});
      
      await mondayService.showNotification(
        `Ítem cambiado: ${itemData.name}. Encontrados ${itemData.allContacts?.length || 0} contactos.`,
        'success'
      );
      
    } catch (err) {
      console.error('Error changing test item:', err);
      setError(err.message);
      await mondayService.showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Resetear aplicación
  const handleReset = () => {
    setSelectedTemplate(null);
    setTemplateDetails(null);
    setPreviewUrl(null);
    setSignerMapping({});
    setSubmissionResult(null);
    setError(null);
    setSelectedPdf(null);
    setShowDocumentProcessor(false);
    setProcessingResult(null);
  };

  // Funciones para DocumentProcessor
  const handlePdfSelection = (pdf) => {
    setSelectedPdf(pdf);
    setShowDocumentProcessor(true);
    setProcessingResult(null);
    console.log('PDF selected for processing:', pdf);
  };

  const handleProcessComplete = (result) => {
    setProcessingResult(result);
    console.log('Document processing completed:', result);
    
    // Mostrar notificación de éxito
    mondayService.showNotification(result.message, 'success');
  };

  const handleProcessError = (errorMessage) => {
    console.error('Document processing error:', errorMessage);
    setError(errorMessage);
    mondayService.showNotification(errorMessage, 'error');
  };

  const handleCloseProcessor = () => {
    setShowDocumentProcessor(false);
    setSelectedPdf(null);
    setProcessingResult(null);
  };

  if (isLoading && !mondayContext) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <h3>Cargando Gestor de Firmas DocuSeal...</h3>
        <p>Conectando con Monday.com y DocuSeal...</p>
      </div>
    );
  }

  if (error && !mondayContext) {
    return (
      <div className="app-error">
        <h3>Error al cargar la aplicación</h3>
        <p>{error}</p>
        <button onClick={loadInitialData} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Banner de modo desarrollo */}
      {(process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development') && (
        <div className="dev-banner">
          🔧 <strong>Modo Desarrollo:</strong> Usando datos simulados. Para producción, configure las conexiones reales con Monday.com y DocuSeal.
        </div>
      )}

      <header className="app-header">
        <h1>🖊️ Gestor de Firmas DocuSeal</h1>
        <div className="item-info">
          <h2>{mondayItemData?.name || 'Cargando ítem...'}</h2>
          <p>
            Contactos disponibles: {mondayItemData?.allContacts?.length || 0} | 
            Plantillas: {templates.length}
            {mondayItemData?.pdfs && mondayItemData.pdfs.length > 0 && (
              <> | PDFs encontrados: {mondayItemData.pdfs.length}</>
            )}
          </p>
          {mondayContext?.isTestMode && (
            <span className="test-mode-badge">
              {mondayContext.isMockMode ? '🧪 MODO MOCK' : '🔗 DATOS REALES DE MONDAY'}
            </span>
          )}
        </div>
      </header>

      <main className="app-main">
        {/* Selector de modo de pruebas */}
        <TestModeSelector 
          onItemSelect={handleTestItemChange}
          currentContext={mondayContext}
        />

        {submissionResult ? (
          // Pantalla de éxito
          <div className="submission-success">
            <div className="success-icon">✅</div>
            <h2>¡Proceso de firma iniciado exitosamente!</h2>
            <div className="submission-details">
              <p><strong>ID de Submisión:</strong> {submissionResult.id}</p>
              <p><strong>Estado:</strong> {submissionResult.status}</p>
              <p><strong>Plantilla:</strong> {selectedTemplate.name}</p>
              <p><strong>Firmantes:</strong> {submissionResult.submitters?.length || 0}</p>
              {submissionResult.expires_at && (
                <p><strong>Expira:</strong> {new Date(submissionResult.expires_at).toLocaleDateString()}</p>
              )}
            </div>
            <p className="success-message">
              DocuSeal se encargará del resto del proceso. Los firmantes recibirán 
              notificaciones por correo electrónico con las instrucciones para firmar.
            </p>
            <div className="success-actions">
              <button onClick={handleReset} className="new-signature-button">
                Enviar Nueva Firma
              </button>
            </div>
          </div>
        ) : (
          // Pantalla principal
          <>
            {/* Selección de plantilla */}
            <section className="template-selection">
              <h3>1. Seleccionar Plantilla de Documento</h3>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => handleTemplateSelection(e.target.value)}
                className="template-select"
                disabled={isLoading}
              >
                <option value="">Seleccionar plantilla...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              
              {templates.length === 0 && !isLoading && (
                <p className="no-templates">
                  No se encontraron plantillas en DocuSeal. 
                  Verifique la configuración del servidor.
                </p>
              )}
            </section>

            {/* Sección de PDFs disponibles para procesar */}
            {mondayItemData?.pdfs && mondayItemData.pdfs.length > 0 && (
              <section className="available-pdfs">
                <h3>💼 PDFs Disponibles en Monday</h3>
                <p className="pdfs-description">
                  Selecciona un PDF para enviarlo directamente a DocuSeal con los correos extraídos del ítem.
                </p>
                <div className="pdfs-grid">
                  {mondayItemData.pdfs.map((pdf, index) => (
                    <div key={index} className="pdf-card">
                      <div className="pdf-info">
                        <h4>📄 {pdf.name}</h4>
                        <div className="pdf-meta">
                          <small>URL: {pdf.url}</small>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePdfSelection(pdf)}
                        className="process-pdf-button"
                        disabled={isSubmitting}
                      >
                        🚀 Procesar con DocuSeal
                      </button>
                    </div>
                  ))}
                </div>
                <div className="emails-summary">
                  <h4>📧 Emails que se enviarán:</h4>
                  <ul>
                    {mondayItemData.allContacts?.map((contact, index) => (
                      <li key={index}>
                        {contact.name || contact.displayName} - {contact.email}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* DocumentProcessor Modal/Section */}
            {showDocumentProcessor && selectedPdf && (
              <section className="document-processor-section">
                <div className="processor-header-actions">
                  <h3>🔧 Procesar Documento</h3>
                  <button 
                    onClick={handleCloseProcessor} 
                    className="close-processor-button"
                  >
                    ✕ Cerrar
                  </button>
                </div>
                <DocumentProcessor
                  selectedPdf={selectedPdf}
                  emails={mondayItemData?.allContacts || []}
                  mondayItemId={mondayContext?.itemId}
                  mondayBoardId={mondayContext?.boardId}
                  docusealService={docusealService}
                  onProcessComplete={handleProcessComplete}
                  onError={handleProcessError}
                />
                
                {processingResult && (
                  <div className="processing-result">
                    <div className="result-success">
                      <h4>✅ {processingResult.message}</h4>
                      <p>Se ha abierto DocuSeal en una nueva ventana/pestaña.</p>
                      {processingResult.result?.edit_url && (
                        <a 
                          href={processingResult.result.edit_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="open-docuseal-link"
                        >
                          🔗 Abrir DocuSeal
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Vista previa del PDF */}
            {selectedTemplate && (
              <section className="template-preview">
                <PDFViewer
                  pdfUrl={previewUrl}
                  templateName={selectedTemplate.name}
                  onLoadError={(error) => console.warn('PDF preview error:', error)}
                />
              </section>
            )}

            {/* Mapeo de firmantes */}
            {templateDetails && mondayItemData && (
              <section className="signer-assignment">
                <SignerMapper
                  templateSubmitters={templateDetails.submitters || []}
                  mondayContacts={mondayItemData.allContacts || []}
                  onMappingChange={handleMappingChange}
                  mapping={signerMapping}
                />
              </section>
            )}

            {/* Botón de envío */}
            {selectedTemplate && templateDetails && Object.keys(signerMapping).length > 0 && (
              <section className="submission-section">
                <div className="submission-summary">
                  <h3>2. Resumen y Envío</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <strong>Plantilla:</strong> {selectedTemplate.name}
                    </div>
                    <div className="summary-item">
                      <strong>Firmantes asignados:</strong> {Object.keys(signerMapping).length}
                    </div>
                    <div className="summary-item">
                      <strong>Ítem de Monday:</strong> {mondayItemData.name}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleSubmitSignature}
                  disabled={isSubmitting || Object.keys(signerMapping).length === 0}
                  className="submit-signature-button"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner small"></span>
                      Enviando solicitud...
                    </>
                  ) : (
                    '📤 Enviar a Firmar'
                  )}
                </button>
              </section>
            )}
          </>
        )}

        {/* Error general */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="dismiss-error">×</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
