import axios from 'axios';

class DocuSealService {
  constructor() {
    // Configuración base del servidor DocuSeal de la fundación
    // En desarrollo usa proxy, en producción usa URL completa
    this.baseURL = process.env.NODE_ENV === 'development' 
      ? '' // Usar proxy en desarrollo
      : process.env.REACT_APP_DOCUSEAL_BASE_URL || 'http://localhost:3000';
    
    this.apiKey = process.env.REACT_APP_DOCUSEAL_API_KEY || '';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
      }
    });
  }

  /**
   * Obtiene todas las plantillas disponibles en DocuSeal
   * @returns {Promise<Array>} Lista de plantillas
   */
  async getTemplates() {
    try {
      const response = await this.client.get('/api/templates');
      return response.data.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description || '',
        created_at: template.created_at,
        updated_at: template.updated_at
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      
      // Si estamos en desarrollo y no hay servidor DocuSeal, usar datos mock
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development') {
        console.warn('Using mock templates for development - DocuSeal server not available');
        return [
          {
            id: 'mock-template-1',
            name: 'Convenio de Voluntariado',
            description: 'Plantilla para convenios con voluntarios',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 'mock-template-2',
            name: 'Acuerdo de Confidencialidad',
            description: 'Plantilla para acuerdos de confidencialidad',
            created_at: '2024-01-10T10:00:00Z',
            updated_at: '2024-01-10T10:00:00Z'
          },
          {
            id: 'mock-template-3',
            name: 'Contrato de Proveedor',
            description: 'Plantilla para contratos con proveedores',
            created_at: '2024-01-05T10:00:00Z',
            updated_at: '2024-01-05T10:00:00Z'
          }
        ];
      }
      
      if (error.response?.status === 401) {
        throw new Error('No autorizado para acceder a DocuSeal. Verifique la configuración de API.');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint de plantillas no encontrado en el servidor DocuSeal.');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('No se puede conectar al servidor DocuSeal. Verifique que esté funcionando.');
      }
      throw new Error('Error al obtener las plantillas de DocuSeal');
    }
  }

  /**
   * Obtiene los detalles de una plantilla específica incluyendo los roles de firmantes
   * @param {string} templateId - ID de la plantilla
   * @returns {Promise<Object>} Detalles de la plantilla con roles
   */
  async getTemplateDetails(templateId) {
    try {
      const response = await this.client.get(`/api/templates/${templateId}`);
      const template = response.data;
      
      return {
        id: template.id,
        name: template.name,
        description: template.description || '',
        submitters: template.submitters || [],
        fields: template.fields || [],
        schema: template.schema || [],
        documents: template.documents || [],
        created_at: template.created_at,
        updated_at: template.updated_at
      };
    } catch (error) {
      console.error('Error fetching template details:', error);
      
      // Si estamos en desarrollo, usar datos mock
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development') {
        console.warn('Using mock template details for development');
        
        // Crear datos mock específicos según el templateId
        const mockTemplateDetails = {
          'mock-template-1': {
            id: 'mock-template-1',
            name: 'Convenio de Voluntariado',
            description: 'Plantilla para convenios con voluntarios',
            submitters: [
              { uuid: 'submitter-1', name: 'Representante Fundación' },
              { uuid: 'submitter-2', name: 'Voluntario' }
            ],
            fields: [],
            schema: [],
            documents: [],
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          },
          'mock-template-2': {
            id: 'mock-template-2',
            name: 'Acuerdo de Confidencialidad',
            description: 'Plantilla para acuerdos de confidencialidad',
            submitters: [
              { uuid: 'submitter-1', name: 'Representante Legal' },
              { uuid: 'submitter-2', name: 'Contraparte' }
            ],
            fields: [],
            schema: [],
            documents: [],
            created_at: '2024-01-10T10:00:00Z',
            updated_at: '2024-01-10T10:00:00Z'
          },
          'mock-template-3': {
            id: 'mock-template-3',
            name: 'Contrato de Proveedor',
            description: 'Plantilla para contratos con proveedores',
            submitters: [
              { uuid: 'submitter-1', name: 'Director Fundación' },
              { uuid: 'submitter-2', name: 'Proveedor' },
              { uuid: 'submitter-3', name: 'Testigo' }
            ],
            fields: [],
            schema: [],
            documents: [],
            created_at: '2024-01-05T10:00:00Z',
            updated_at: '2024-01-05T10:00:00Z'
          }
        };
        
        return mockTemplateDetails[templateId] || {
          id: templateId,
          name: 'Plantilla de Prueba',
          description: 'Plantilla mock para desarrollo',
          submitters: [
            { uuid: 'submitter-1', name: 'Firmante 1' },
            { uuid: 'submitter-2', name: 'Firmante 2' }
          ],
          fields: [],
          schema: [],
          documents: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      if (error.response?.status === 404) {
        throw new Error('Plantilla no encontrada');
      }
      throw new Error('Error al obtener los detalles de la plantilla');
    }
  }

  /**
   * Obtiene la URL de previsualización del PDF de una plantilla
   * @param {string} templateId - ID de la plantilla
   * @returns {Promise<string>} URL del PDF
   */
  async getTemplatePreviewURL(templateId) {
    try {
      // En desarrollo, usar un PDF de ejemplo
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development') {
        // Usar un PDF público de ejemplo para mostrar la funcionalidad
        return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      }
      
      // Construir la URL de previsualización
      return `${this.baseURL}/api/templates/${templateId}/preview.pdf`;
    } catch (error) {
      console.error('Error getting template preview URL:', error);
      throw new Error('Error al obtener la URL de previsualización');
    }
  }

  /**
   * Crea una nueva submisión para firma
   * @param {Object} submissionData - Datos de la submisión
   * @param {string} submissionData.template_id - ID de la plantilla
   * @param {Array} submissionData.submitters - Array de firmantes
   * @param {string} submissionData.send_email - Si enviar email automáticamente
   * @param {Object} submissionData.metadata - Metadatos adicionales
   * @returns {Promise<Object>} Respuesta de la submisión creada
   */
  async createSubmission(submissionData) {
    try {
      const payload = {
        template_id: submissionData.template_id,
        submitters: submissionData.submitters.map(submitter => ({
          name: submitter.name,
          email: submitter.email,
          role: submitter.role || submitter.uuid || 'signer'
        })),
        send_email: submissionData.send_email !== false, // Por defecto true
        metadata: {
          monday_item_id: submissionData.metadata?.monday_item_id,
          monday_board_id: submissionData.metadata?.monday_board_id,
          created_from: 'monday_app',
          ...submissionData.metadata
        }
      };

      console.log('Creating submission with payload:', payload);

      const response = await this.client.post('/api/submissions', payload);
      
      return {
        id: response.data.id,
        slug: response.data.slug,
        status: response.data.status,
        submitters: response.data.submitters,
        created_at: response.data.created_at,
        expires_at: response.data.expires_at,
        audit_log_url: response.data.audit_log_url
      };
    } catch (error) {
      console.error('Error creating submission:', error);
      
      // Si estamos en desarrollo, simular una respuesta exitosa
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development') {
        console.warn('Simulating successful submission for development');
        
        const mockSubmission = {
          id: `mock-submission-${Date.now()}`,
          slug: `mock-slug-${Date.now()}`,
          status: 'awaiting_signature',
          submitters: submissionData.submitters.map((submitter, index) => ({
            id: `submitter-${index + 1}`,
            name: submitter.name,
            email: submitter.email,
            status: 'awaiting_signature',
            role: submitter.role
          })),
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
          audit_log_url: '#'
        };
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return mockSubmission;
      }
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Datos de submisión inválidos';
        throw new Error(`Error en los datos: ${errorMessage}`);
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data?.errors || {};
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('; ');
        throw new Error(`Errores de validación: ${errorMessages}`);
      }
      
      throw new Error('Error al crear la solicitud de firma en DocuSeal');
    }
  }

  /**
   * Obtiene el estado de una submisión
   * @param {string} submissionId - ID de la submisión
   * @returns {Promise<Object>} Estado actual de la submisión
   */
  async getSubmissionStatus(submissionId) {
    try {
      const response = await this.client.get(`/api/submissions/${submissionId}`);
      return {
        id: response.data.id,
        status: response.data.status,
        submitters: response.data.submitters,
        completed_at: response.data.completed_at,
        expires_at: response.data.expires_at
      };
    } catch (error) {
      console.error('Error fetching submission status:', error);
      throw new Error('Error al obtener el estado de la submisión');
    }
  }

  /**
   * Crea una nueva plantilla en DocuSeal con archivo subido
   * @param {Object} templateData - Datos para crear la plantilla
   * @param {string} templateData.name - Nombre de la plantilla
   * @param {string} templateData.file - Base64 del archivo PDF
   * @param {string} templateData.fileName - Nombre del archivo
   * @param {Array} templateData.signers - Array de firmantes con email y name
   * @returns {Promise<Object>} Plantilla creada
   */
  async createTemplate(templateData) {
    try {
      // Primero verificar si DocuSeal está disponible
      console.log('🔍 Verificando conexión con DocuSeal...');
      try {
        await this.client.get('/api/templates');
        console.log('✅ DocuSeal API responde correctamente');
      } catch (healthError) {
        console.warn('⚠️ Error verificando DocuSeal:', healthError.message);
        throw new Error('DocuSeal no está disponible. Verifica que esté corriendo en localhost:3000');
      }

      console.log('🔧 Creando plantilla con datos:', {
        name: templateData.name,
        fileName: templateData.fileName,
        signersCount: templateData.signers.length,
        fileSize: templateData.file.length
      });

      // Preparar el payload según la API de DocuSeal
      const payload = {
        name: templateData.name,
        external_id: `upload_${Date.now()}`,
        shared_link: true,
        documents: [
          {
            name: templateData.fileName,
            file: templateData.file // Base64 del PDF sin prefijo
          }
        ]
      };

      console.log('📡 Payload a enviar:', {
        name: payload.name,
        external_id: payload.external_id,
        shared_link: payload.shared_link,
        documents: payload.documents.map(doc => ({
          name: doc.name,
          fileSize: doc.file.length
        }))
      });

      console.log('📡 Enviando solicitud a DocuSeal API usando /api/templates/pdf...');
      console.log(`🌐 URL completa: ${this.baseURL}/api/templates/pdf`);
      
      // Usar el endpoint correcto para crear plantilla desde PDF
      const response = await this.client.post('/api/templates/pdf', payload);
      
      const template = response.data;
      console.log('✅ Respuesta de DocuSeal:', template);
      console.log('✅ Plantilla creada exitosamente:', template.id);
      
      return {
        id: template.id,
        name: template.name,
        url: template.shared_link || `${this.baseURL}/templates/${template.id}`,
        external_id: template.external_id,
        created_at: template.created_at,
        signers: templateData.signers,
        editUrl: `${this.baseURL}/templates/${template.id}/edit`
      };
      
    } catch (error) {
      console.error('❌ Error creando plantilla:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      // Si falla la API, proporcionar instrucciones manuales
      throw new Error(`Error al crear plantilla automáticamente. Usa el flujo manual en DocuSeal: ${error.message}`);
    }
  }

  /**
   * Crea una nueva plantilla en DocuSeal con un PDF y emails
   * @param {Object} templateData - Datos para crear la plantilla
   * @param {string} templateData.name - Nombre de la plantilla
   * @param {string} templateData.pdfUrl - URL del PDF desde Monday
   * @param {Array} templateData.emails - Array de emails extraídos
   * @returns {Promise<Object>} Plantilla creada
   */
  async createTemplateFromPDF(templateData) {
    try {
      // Crear roles únicos para cada email
      const roles = [];
      const roleMap = new Map();
      
      templateData.emails.forEach((email, index) => {
        const roleName = `signer_${index + 1}`;
        if (!roleMap.has(email.email)) {
          roleMap.set(email.email, roleName);
          roles.push({
            name: roleName,
            email: email.email,
            description: email.columnTitle || `Firmante ${index + 1}`
          });
        }
      });

      const payload = {
        name: templateData.name || 'Plantilla desde Monday',
        external_id: `monday_${templateData.mondayItemId}_${Date.now()}`,
        shared_link: true,
        documents: [
          {
            name: templateData.pdfName || 'documento.pdf',
            file: templateData.pdfBase64 // Base64 del PDF
          }
        ],
        // Agregar campos básicos para firmas si no se especifican
        fields: roles.map((role, index) => [
          {
            name: `signature_${role.name}`,
            type: 'signature',
            role: role.name,
            required: true
          },
          {
            name: `date_${role.name}`,
            type: 'date',
            role: role.name,
            required: false
          }
        ]).flat()
      };

      console.log('Creating template from PDF with payload:', payload);

      const response = await this.client.post('/templates/pdf', payload);
      
      return {
        id: response.data.id,
        name: response.data.name,
        external_id: response.data.external_id,
        documents: response.data.documents,
        created_at: response.data.created_at,
        edit_url: `${this.baseURL}/templates/${response.data.id}/edit`,
        view_url: `${this.baseURL}/templates/${response.data.id}`,
        roles: roles
      };
    } catch (error) {
      console.error('Error creating template from PDF:', error);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Datos de plantilla inválidos';
        throw new Error(`Error en los datos: ${errorMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error('Error de autenticación con DocuSeal. Verifique la API key.');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint no encontrado. Verifique que DocuSeal esté corriendo.');
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data?.errors || {};
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('; ');
        throw new Error(`Errores de validación: ${errorMessages}`);
      } else {
        throw new Error(`Error del servidor DocuSeal: ${error.message}`);
      }
    }
  }

  /**
   * Crea una submisión directa con PDF y emails (sin plantilla previa)
   * @param {Object} submissionData - Datos para la submisión directa
   * @returns {Promise<Object>} Submisión creada
   */
  async createDirectSubmission(submissionData) {
    try {
      const payload = {
        documents: [
          {
            name: submissionData.pdfName || 'Documento.pdf',
            url: submissionData.pdfUrl
          }
        ],
        submitters: submissionData.emails.map((email, index) => ({
          name: email.name || email.displayName || `Firmante ${index + 1}`,
          email: email.email,
          role: `signer_${index + 1}`
        })),
        send_email: submissionData.send_email !== false,
        metadata: {
          monday_item_id: submissionData.mondayItemId,
          monday_board_id: submissionData.mondayBoardId,
          created_from: 'monday_app_direct_submission'
        }
      };

      console.log('Creating direct submission:', payload);

      const response = await this.client.post('/api/submissions', payload);
      
      return {
        id: response.data.id,
        slug: response.data.slug,
        status: response.data.status,
        submitters: response.data.submitters,
        created_at: response.data.created_at,
        expires_at: response.data.expires_at,
        edit_url: `${this.baseURL}/submissions/${response.data.slug}/edit`,
        view_url: `${this.baseURL}/submissions/${response.data.slug}`
      };
    } catch (error) {
      console.error('Error creating direct submission:', error);
      throw new Error('Error al crear la submisión directa en DocuSeal');
    }
  }

  /**
   * Obtiene la URL para abrir DocuSeal con datos prellenados
   * @param {Object} data - Datos para prellenar
   * @returns {string} URL de DocuSeal
   */
  getDocuSealURL(data) {
    // Para abrir en el navegador, siempre usar URL completa
    const fullDocuSealURL = process.env.REACT_APP_DOCUSEAL_BASE_URL || 'http://localhost:3000';
    const baseUrl = `${fullDocuSealURL}/templates/new`;
    const params = new URLSearchParams();
    
    if (data.name) {
      params.append('name', data.name);
    }
    
    if (data.pdfUrl) {
      params.append('document_url', data.pdfUrl);
    }
    
    if (data.emails && data.emails.length > 0) {
      data.emails.forEach((email, index) => {
        params.append(`submitter_${index}_name`, email.name || email.displayName);
        params.append(`submitter_${index}_email`, email.email);
      });
    }
    
    return `${baseUrl}?${params.toString()}`;
  }
}

// Exportar instancia única
const docusealService = new DocuSealService();
export default docusealService;
