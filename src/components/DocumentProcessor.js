import React, { useState } from 'react';
import './DocumentProcessor.css';
import mondayAPIService from '../services/mondayAPIService';

const DocumentProcessor = ({ 
  selectedPdf, 
  emails, 
  mondayItemId, 
  mondayBoardId, 
  docusealService,
  onProcessComplete,
  onError 
}) => {
  const [processing, setProcessing] = useState(false);
  const [processType, setProcessType] = useState('template'); // 'template' o 'direct'
  const [templateName, setTemplateName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);

  /**
   * Abre DocuSeal con datos prellenados (método anterior)
   */
  const handleOpenInDocuSeal = () => {
    try {
      console.log(`🔗 Intentando abrir DocuSeal con: ${selectedPdf.fileName}`);
      
      // Verificar si necesita descarga manual
      if (selectedPdf.downloadUrl && !selectedPdf.canAutoDownload) {
        // Mostrar al usuario que debe descargar manualmente
        const userConfirm = window.confirm(
          `Para abrir el documento en DocuSeal, necesitas descargarlo manualmente desde Monday.\n\n` +
          `Archivo: ${selectedPdf.fileName}\n\n` +
          `¿Quieres abrir el enlace de descarga y DocuSeal?`
        );
        
        if (userConfirm) {
          console.log(`🔗 Abriendo descarga manual para: ${selectedPdf.fileName}`);
          
          // Abrir la URL de descarga en una nueva pestaña
          window.open(selectedPdf.downloadUrl, '_blank', 'noopener,noreferrer');
          
          // Abrir DocuSeal en otra pestaña
          setTimeout(() => {
            window.open('http://localhost:3000', '_blank', 'noopener,noreferrer');
          }, 1000);
          
          // Mostrar instrucciones
          alert(
            `Instrucciones:\n\n` +
            `1. Descarga el PDF desde la primera pestaña que se abrió\n` +
            `2. En DocuSeal (segunda pestaña), crea una nueva plantilla\n` +
            `3. Sube el PDF descargado\n` +
            `4. Configura estos emails como firmantes:\n\n` +
            emails.map(e => `• ${e.email} (${e.columnTitle})`).join('\n')
          );
          
          return;
        } else {
          console.log(`❌ Proceso cancelado por el usuario`);
          return;
        }
      }
      
      // Verificar que tenemos URL del PDF para uso directo
      const pdfUrl = selectedPdf.downloadUrl || selectedPdf.fileUrl || selectedPdf.url;
      
      if (!pdfUrl) {
        onError && onError('No se encontró URL válida para el PDF. Verifica que el archivo esté disponible en Monday.');
        return;
      }

      const data = {
        name: templateName || `Documento ${mondayItemId}`,
        pdfUrl: pdfUrl,
        emails: emails
      };

      console.log('🔗 Opening DocuSeal with data:', data);

      const docusealUrl = docusealService.getDocuSealURL(data);
      
      // Abrir en nueva ventana/pestaña
      window.open(docusealUrl, '_blank', 'noopener,noreferrer');
      
      console.log('📄 PDF URL used:', pdfUrl);
      console.log('🌐 DocuSeal URL:', docusealUrl);
      
    } catch (error) {
      console.error('Error opening DocuSeal:', error);
      onError && onError('Error al abrir DocuSeal: ' + error.message);
    }
  };

  /**
   * Maneja la subida del archivo descargado manualmente
   */
  // const handleFileUpload = (event) => {
  //   const file = event.target.files[0];
  //   if (file && file.type === 'application/pdf') {
  //     setUploadedFile(file);
  //     console.log(`📁 Archivo seleccionado: ${file.name}`);
  //   } else {
  //     onError && onError('Por favor selecciona un archivo PDF válido');
  //   }
  // };

  /**
   * Procesa el archivo subido y crea la plantilla en DocuSeal
   */
  // const handleProcessUploadedFile = async () => {
  //   if (!uploadedFile) {
  //     onError && onError('Por favor selecciona un archivo PDF');
  //     return;
  //   }

  //   if (!templateName.trim()) {
  //     onError && onError('Por favor ingresa un nombre para la plantilla');
  //     return;
  //   }

  //   setProcessing(true);
    
  //   try {
  //     console.log(`🚀 Procesando archivo subido: ${uploadedFile.name}`);
  //     console.log(`📏 Tamaño del archivo: ${uploadedFile.size} bytes`);
      
  //     // Como la API de DocuSeal Pro no está disponible, 
  //     // vamos a usar un flujo manual mejorado
  //     console.log('� Usando flujo manual mejorado (DocuSeal gratuito)');
      
  //     const success = window.confirm(
  //       `📄 Archivo listo para DocuSeal\n\n` +
  //       `Archivo: ${uploadedFile.name}\n` +
  //       `Plantilla: ${templateName}\n\n` +
  //       `Firmantes detectados:\n` +
  //       emails.map(e => `• ${e.email} (${e.columnTitle})`).join('\n') +
  //       `\n\n¿Abrir DocuSeal para crear la plantilla manualmente?`
  //     );
      
  //     if (success) {
  //       console.log('🌐 Abriendo DocuSeal para creación manual');
        
  //       // Abrir DocuSeal en nueva pestaña
  //       const docusealWindow = window.open('http://localhost:3000/templates/new', '_blank', 'noopener,noreferrer');
        
  //       // Crear un objeto URL temporal para el archivo
  //       const fileUrl = URL.createObjectURL(uploadedFile);
        
  //       // Mostrar instrucciones detalladas
  //       setTimeout(() => {
  //         alert(
  //           `📋 Instrucciones para DocuSeal:\n\n` +
  //           `1. En DocuSeal, haz clic en "Agregar documentos PDF"\n` +
  //           `2. Arrastra o selecciona el archivo: ${uploadedFile.name}\n` +
  //           `3. Nombra la plantilla: "${templateName}"\n\n` +
  //           `4. Configura estos firmantes:\n` +
  //           emails.map((e, i) => `   ${i+1}. ${e.email} (${e.columnTitle})`).join('\n') +
  //           `\n\n5. Arrastra campos de firma desde la barra lateral\n` +
  //           `6. Asigna cada campo al firmante correspondiente\n` +
  //           `7. Guarda la plantilla cuando termines`
  //         );
  //       }, 1000);
        
  //       // Limpiar el URL temporal después de un tiempo
  //       setTimeout(() => {
  //         URL.revokeObjectURL(fileUrl);
  //       }, 60000);
        
  //       console.log('✅ Flujo manual iniciado correctamente');
  //       onProcessComplete && onProcessComplete({
  //         id: 'manual-' + Date.now(),
  //         name: templateName,
  //         type: 'manual',
  //         fileName: uploadedFile.name,
  //         signers: emails
  //       });
  //     }
      
  //   } catch (error) {
  //     console.error('❌ Error en flujo manual:', error);
  //     onError && onError('Error preparando flujo manual: ' + error.message);
  //   } finally {
  //     setProcessing(false);
  //   }
  // };

  /**
   * Crea una plantilla en DocuSeal
   */
  // const handleCreateTemplate = async () => {
  //   if (!templateName.trim()) {
  //     onError && onError('Por favor ingresa un nombre para la plantilla');
  //     return;
  //   }

  //   setProcessing(true);
    
  //   try {
  //     console.log('📄 PDF selected for processing:', selectedPdf);

  //     // Verificar que tenemos los datos necesarios
  //     if (!selectedPdf.rawFileData?.assetId) {
  //       throw new Error('No se encontró assetId en los datos del PDF');
  //     }

  //     console.log(`� Procesando PDF: ${selectedPdf.fileName}`);
      
  //     // Verificar si necesita descarga manual
  //     if (selectedPdf.downloadUrl && !selectedPdf.canAutoDownload) {
  //       // Mostrar al usuario que debe descargar manualmente
  //       const userConfirm = window.confirm(
  //         `Para crear la plantilla en DocuSeal, necesitas descargar manualmente el PDF desde Monday.\n\n` +
  //         `Archivo: ${selectedPdf.fileName}\n\n` +
  //         `¿Quieres abrir el enlace de descarga?`
  //       );
        
  //       if (userConfirm) {
  //         console.log(`🔗 Abriendo descarga para: ${selectedPdf.fileName}`);
          
  //         // Abrir la URL de descarga en una nueva pestaña
  //         window.open(selectedPdf.downloadUrl, '_blank', 'noopener,noreferrer');
          
  //         // Mostrar instrucciones para continuar
  //         alert(
  //           `Instrucciones:\n\n` +
  //           `1. Descarga el archivo PDF desde la pestaña que se abrió\n` +
  //           `2. Luego ve directamente a DocuSeal para crear la plantilla manualmente\n` +
  //           `3. Usa estos emails para los firmantes:\n\n` +
  //           emails.map(e => `• ${e.email} (${e.columnTitle})`).join('\n')
  //         );
          
  //         console.log(`🚀 Abriendo DocuSeal para crear plantilla manualmente`);
          
  //         // Abrir DocuSeal para que el usuario pueda crear la plantilla manualmente
  //         window.open('http://localhost:3000', '_blank', 'noopener,noreferrer');
          
  //         return;
  //       } else {
  //         console.log(`❌ Proceso cancelado por el usuario`);
  //         throw new Error('Proceso cancelado por el usuario');
  //       }
  //     }
      
  //     // Si llega aquí, verificar si tenemos base64 (para futura implementación)
  //     if (!selectedPdf.fileBase64) {
  //       throw new Error('PDF no tiene datos base64 disponibles. Usa descarga manual.');
  //     }

  //     console.log('✅ PDF base64 data available');

  //     const templateData = {
  //       name: templateName,
  //       pdfBase64: selectedPdf.fileBase64,
  //       pdfName: selectedPdf.fileName || 'documento.pdf',
  //       emails: emails,
  //       mondayItemId: mondayItemId,
  //       mondayBoardId: mondayBoardId
  //     };

  //     console.log('🔧 Creating template with data:', {
  //       ...templateData,
  //       pdfBase64: `[Base64 data: ${selectedPdf.fileBase64.length} characters]` // No mostrar todo el base64 en logs
  //     });

  //     const template = await docusealService.createTemplateFromPDF(templateData);
      
  //     console.log('✅ Template created:', template);
      
  //     // Abrir el editor de plantilla
  //     window.open(template.edit_url, '_blank', 'noopener,noreferrer');
      
  //     onProcessComplete && onProcessComplete({
  //       type: 'template',
  //       result: template,
  //       message: `Plantilla "${template.name}" creada exitosamente`
  //     });
      
  //   } catch (error) {
  //     console.error('Error creating template:', error);
  //     onError && onError('Error al crear la plantilla: ' + error.message);
  //   } finally {
  //     setProcessing(false);
  //   }
  // };

  /**
   * Crea una submisión directa
   */
  // const handleCreateDirectSubmission = async () => {
  //   const pdfUrl = selectedPdf.fileUrl || selectedPdf.url;
  //   if (!pdfUrl) {
  //     onError && onError('No se encontró URL válida para el PDF');
  //     return;
  //   }

  //   setProcessing(true);
    
  //   try {
  //     const submissionData = {
  //       pdfUrl: pdfUrl,
  //       pdfName: selectedPdf.fileName || selectedPdf.name,
  //       emails: emails,
  //       mondayItemId: mondayItemId,
  //       mondayBoardId: mondayBoardId,
  //       send_email: false // Por ahora no enviamos emails automáticamente
  //     };

  //     console.log('🚀 Creating direct submission with data:', submissionData);

  //     const submission = await docusealService.createDirectSubmission(submissionData);
      
  //     console.log('✅ Direct submission created:', submission);
      
  //     // Abrir el editor de submisión
  //     window.open(submission.edit_url, '_blank', 'noopener,noreferrer');
      
  //     onProcessComplete && onProcessComplete({
  //       type: 'submission',
  //       result: submission,
  //       message: 'Submisión directa creada exitosamente'
  //     });
      
  //   } catch (error) {
  //     console.error('Error creating direct submission:', error);
  //     onError && onError('Error al crear la submisión: ' + error.message);
  //   } finally {
  //     setProcessing(false);
  //   }
  // };

  return (
    <div className="document-processor">
      {/* <div className="processor-header">
        <h3>📄 Procesar Documento</h3>
        <div className="selected-document">
          <strong>PDF:</strong> {selectedPdf.fileName || selectedPdf.name || selectedPdf.displayName}
          <div className="pdf-debug-info">
            <small>
              URL: {selectedPdf.fileUrl || selectedPdf.url || 'No disponible'} | 
              ID: {selectedPdf.fileId || 'N/A'}
            </small>
          </div>
        </div>
        <div className="selected-emails">
          <strong>Emails ({emails.length}):</strong>
          <ul>
            {emails.map((email, index) => (
              <li key={index}>
                {email.name || email.displayName} - {email.email}
              </li>
            ))}
          </ul>
        </div>
      </div> */}

      {/* <div className="processor-options">
        <div className="process-type-selector">
          <label>
            <input
              type="radio"
              value="open"
              checked={processType === 'open'}
              onChange={(e) => setProcessType(e.target.value)}
            />
            Abrir en DocuSeal (prellenado)
          </label>
          <label>
            <input
              type="radio"
              value="template"
              checked={processType === 'template'}
              onChange={(e) => setProcessType(e.target.value)}
            />
            Crear Plantilla
          </label>
          <label>
            <input
              type="radio"
              value="direct"
              checked={processType === 'direct'}
              onChange={(e) => setProcessType(e.target.value)}
            />
            Submisión Directa
          </label>
        </div>

        {processType === 'template' && (
          <div className="template-options">
            <input
              type="text"
              placeholder="Nombre de la plantilla"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="template-name-input"
            />
            
            <div className="upload-option">
              <label>
                <input
                  type="checkbox"
                  checked={showFileUpload}
                  onChange={(e) => setShowFileUpload(e.target.checked)}
                />
                Subir archivo PDF descargado manualmente
              </label>
              
              {showFileUpload && (
                <div className="file-upload-section">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  {uploadedFile && (
                    <div className="uploaded-file-info">
                      ✅ Archivo seleccionado: {uploadedFile.name}
                    </div>
                  )}
                  <div className="upload-info">
                    💡 <strong>Nota:</strong> DocuSeal gratuito requiere creación manual de plantillas. 
                    Esta opción preparará todos los datos y abrirá DocuSeal con instrucciones detalladas.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div> */}

      <div className="processor-actions">
        {processType === 'open' && (
          <button
            onClick={handleOpenInDocuSeal}
            className="action-button open-button"
            disabled={processing}
          >
            🔗 Abrir en DocuSeal
          </button>
        )}

        {processType === 'template' && (
          <button
            onClick={showFileUpload && uploadedFile ? handleProcessUploadedFile : handleCreateTemplate}
            className="action-button template-button"
            disabled={processing || !templateName.trim() || (showFileUpload && !uploadedFile)}
          >
            {processing ? '⏳ Procesando...' : 
             showFileUpload && uploadedFile ? '� Abrir DocuSeal con Datos Preparados' : 
             '📝 Crear Plantilla'}
          </button>
        )}

        {processType === 'direct' && (
          <button
            onClick={handleCreateDirectSubmission}
            className="action-button direct-button"
            disabled={processing}
          >
            {processing ? '⏳ Creando...' : '🚀 Crear Submisión'}
          </button>
        )}
      </div>

      <div className="processor-info">
        <div className="info-item">
          <strong>📋 Item ID:</strong> {mondayItemId}
        </div>
        <div className="info-item">
          <strong>📊 Board ID:</strong> {mondayBoardId}
        </div>
      </div>
    </div>
  );
};

export default DocumentProcessor;
