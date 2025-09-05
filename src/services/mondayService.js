import mondaySdk from 'monday-sdk-js';
import mondayAPIService from './mondayAPIService';

const monday = mondaySdk();

class MondayService {
  constructor() {
    this.monday = monday;
    this.useRealMonday = process.env.REACT_APP_USE_REAL_MONDAY === 'true';
    this.testBoardId = process.env.REACT_APP_TEST_BOARD_ID;
  }

  /**
   * Detecta si estamos en el contexto de Monday.com o en desarrollo
   */
  isInMondayContext() {
    try {
      return window.parent !== window && window.location !== window.parent.location;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene el contexto actual del ítem en Monday
   */
  async getContext() {
    try {
      // Si estamos usando Monday real con token para pruebas
      if (this.useRealMonday && !this.isInMondayContext()) {
        console.log('Using Monday API with token for testing');
        
        const validation = await mondayAPIService.validateConnection();
        if (!validation.isValid) {
          throw new Error(`Error de autenticación con Monday: ${validation.error}`);
        }

        const items = await mondayAPIService.listBoardItems();
        const firstItem = items[0];
        
        if (!firstItem) {
          throw new Error('No se encontraron ítems en el tablero de pruebas');
        }

        return {
          itemId: firstItem.id,
          boardId: this.testBoardId,
          user: validation.user,
          isTestMode: true
        };
      }

      // Contexto normal de Monday (cuando la app está dentro de Monday)
      if (this.isInMondayContext()) {
        const context = await this.monday.get('context');
        return {
          ...context.data,
          isTestMode: false
        };
      }

      // Modo de desarrollo con datos mock
      console.log('Using mock data for development');
      return {
        itemId: 'mock_item_123',
        boardId: 'mock_board_456',
        user: { name: 'Usuario de Prueba', email: 'test@example.com' },
        isTestMode: true,
        isMockMode: true
      };
    } catch (error) {
      console.error('Error getting Monday context:', error);
      
      // Fallback a modo mock si hay cualquier error
      return {
        itemId: 'mock_item_123',
        boardId: 'mock_board_456',
        user: { name: 'Usuario de Prueba', email: 'test@example.com' },
        isTestMode: true,
        isMockMode: true,
        error: error.message
      };
    }
  }

  /**
   * Obtiene los datos de un ítem específico de Monday
   */
  async getItemData(itemId, emailColumns = ['email'], peopleColumns = ['person']) {
    try {
      // Si estamos usando Monday real con token para pruebas
      if (this.useRealMonday && !this.isInMondayContext()) {
        console.log('Getting real item data from Monday API');
        const itemData = await mondayAPIService.getProcessedItemData(itemId);
        
        return {
          id: itemData.id,
          name: itemData.name,
          emails: itemData.emails,
          people: [], // Los emails ya están procesados
          pdfs: itemData.pdfs,
          allContacts: itemData.allContacts,
          columnValues: itemData.columnValues,
          isTestMode: true
        };
      }

      // Contexto normal de Monday
      if (this.isInMondayContext()) {
        const query = `
          query {
            items(ids: [${itemId}]) {
              id
              name
              column_values {
                id
                text
                type
                value
              }
            }
          }
        `;

        const response = await this.monday.api(query);
        
        if (!response.data || !response.data.items || response.data.items.length === 0) {
          throw new Error('Ítem no encontrado');
        }

        const item = response.data.items[0];
        return this.processItemData(item);
      }

      // Datos mock para desarrollo
      console.log('Using mock item data');
      return {
        id: itemId,
        name: 'Convenio de Prueba - Proveedor XYZ',
        emails: [
          {
            columnId: 'email1',
            email: 'solicitante@fundacion.org',
            displayName: 'Solicitado Por'
          },
          {
            columnId: 'email2', 
            email: 'lider@fundacion.org',
            displayName: 'Autorizado Por (Líder Proceso)'
          },
          {
            columnId: 'email3',
            email: 'economica@fundacion.org',
            displayName: 'Aprobado por (económica)'
          },
          {
            columnId: 'email4',
            email: 'gerencia@fundacion.org',
            displayName: 'Aprobado Por (Gerencia)'
          }
        ],
        people: [],
        allContacts: [
          {
            email: 'solicitante@fundacion.org',
            name: 'Solicitado Por',
            source: 'email_column',
            columnId: 'email1'
          },
          {
            email: 'lider@fundacion.org', 
            name: 'Autorizado Por (Líder Proceso)',
            source: 'email_column',
            columnId: 'email2'
          },
          {
            email: 'economica@fundacion.org',
            name: 'Aprobado por (económica)',
            source: 'email_column',
            columnId: 'email3'
          },
          {
            email: 'gerencia@fundacion.org',
            name: 'Aprobado Por (Gerencia)',
            source: 'email_column',
            columnId: 'email4'
          }
        ],
        columnValues: [],
        isMockMode: true
      };

    } catch (error) {
      console.error('Error getting item data:', error);
      throw new Error('No se pudieron obtener los datos del ítem: ' + error.message);
    }
  }

  /**
   * Procesa los datos de un ítem de Monday
   */
  processItemData(item) {
    const extractedData = {
      id: item.id,
      name: item.name,
      emails: [],
      people: [],
      columnValues: item.column_values
    };

    // Procesar columnas para extraer emails y personas
    item.column_values.forEach(column => {
      if (column.type === 'email') {
        if (column.text && column.text.trim()) {
          extractedData.emails.push({
            columnId: column.id,
            email: column.text.trim(),
            displayName: `Email de ${column.id}`
          });
        }
      }

      if (column.type === 'multiple-person') {
        try {
          const value = JSON.parse(column.value || '{}');
          if (value.personsAndTeams) {
            value.personsAndTeams.forEach(person => {
              if (person.email) {
                extractedData.people.push({
                  columnId: column.id,
                  email: person.email,
                  name: person.name,
                  displayName: `${person.name} (${person.email})`
                });
              }
            });
          }
        } catch (e) {
          console.warn('Error parsing person column value:', e);
        }
      }
    });

    // Combinar todos los contactos disponibles
    extractedData.allContacts = [
      ...extractedData.emails.map(e => ({
        email: e.email,
        name: e.displayName,
        source: 'email_column',
        columnId: e.columnId
      })),
      ...extractedData.people.map(p => ({
        email: p.email,
        name: p.name,
        source: 'person_column',
        columnId: p.columnId
      }))
    ];

    return extractedData;
  }

  /**
   * Muestra una notificación
   */
  async showNotification(message, type = 'success') {
    try {
      if (this.isInMondayContext()) {
        await this.monday.execute('notice', { 
          message: message,
          type: type,
          timeout: 5000
        });
      } else {
        // En desarrollo, mostrar en consola
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Actualiza una columna del ítem actual
   */
  async updateColumnValue(itemId, columnId, value) {
    try {
      if (this.isInMondayContext()) {
        const mutation = `
          mutation {
            change_column_value(
              item_id: ${itemId},
              column_id: "${columnId}",
              value: "${value}"
            ) {
              id
            }
          }
        `;

        await this.monday.api(mutation);
      } else {
        console.log(`Mock update: Item ${itemId}, Column ${columnId} = ${value}`);
      }
    } catch (error) {
      console.error('Error updating column value:', error);
      throw new Error('No se pudo actualizar la columna');
    }
  }

  /**
   * Lista ítems del tablero para pruebas
   */
  async listTestItems() {
    try {
      if (this.useRealMonday && !this.isInMondayContext()) {
        return await mondayAPIService.listBoardItems();
      }
      
      // Mock items
      return [
        { id: 'mock_item_123', name: 'Convenio Proveedor A', created_at: new Date().toISOString() },
        { id: 'mock_item_124', name: 'Convenio Proveedor B', created_at: new Date().toISOString() },
        { id: 'mock_item_125', name: 'Convenio Proveedor C', created_at: new Date().toISOString() }
      ];
    } catch (error) {
      console.error('Error listing test items:', error);
      // Return mock items as fallback
      return [
        { id: 'mock_item_123', name: 'Convenio Proveedor A (Mock)', created_at: new Date().toISOString() }
      ];
    }
  }

  /**
   * Obtiene información del tablero actual
   */
  async getBoardInfo(boardId) {
    try {
      if (this.useRealMonday && !this.isInMondayContext()) {
        return await mondayAPIService.getBoardInfo();
      }

      if (this.isInMondayContext()) {
        const query = `
          query {
            boards(ids: [${boardId}]) {
              id
              name
              columns {
                id
                title
                type
              }
            }
          }
        `;

        const response = await this.monday.api(query);
        return response.data.boards[0];
      }

      // Mock data
      return {
        id: boardId,
        name: 'Tablero de Pruebas',
        columns: [
          { id: 'pdf', title: 'PDF', type: 'file' },
          { id: 'email1', title: 'Solicitado Por-correo', type: 'email' },
          { id: 'email2', title: 'Autorizado Por (Líder Proceso)-correo', type: 'email' }
        ]
      };
    } catch (error) {
      console.error('Error getting board info:', error);
      throw new Error('No se pudo obtener la información del tablero');
    }
  }

  /**
   * 🧪 FUNCIÓN DE PRUEBA: Busca ítem específico por RQ
   */
  async testItemByRQ(rqValue = '25-17-ul') {
    try {
      console.log(`🧪 === PRUEBA: Buscando ítem con RQ: ${rqValue} ===`);
      
      const boardId = this.testBoardId || '8837207020';
      console.log(`📋 Board ID: ${boardId}`);
      
      // Usar el nuevo método de mondayAPIService
      const itemData = await mondayAPIService.getProcessedItemDataByRQ(boardId, rqValue);
      
      console.log(`✅ Ítem encontrado:`, itemData);
      console.log(`📧 Emails encontrados: ${itemData.allContacts.length}`);
      console.log(`📄 PDFs encontrados: ${itemData.pdfs.length}`);
      
      // Mostrar detalles de los emails
      if (itemData.allContacts.length > 0) {
        console.log('📧 Detalle de emails:');
        itemData.allContacts.forEach((contact, index) => {
          console.log(`  ${index + 1}. ${contact.columnTitle}: ${contact.email}`);
        });
      }
      
      // Mostrar detalles de los PDFs
      if (itemData.pdfs.length > 0) {
        console.log('📄 Detalle de PDFs:');
        itemData.pdfs.forEach((pdf, index) => {
          console.log(`  ${index + 1}. ${pdf.columnTitle}: ${pdf.fileName}`);
          console.log(`     URL: ${pdf.fileUrl || 'No disponible'}`);
        });
      }
      
      return itemData;
      
    } catch (error) {
      console.error(`❌ Error en prueba de RQ ${rqValue}:`, error);
      throw error;
    }
  }
}

// Exportar instancia única
const mondayService = new MondayService();
export default mondayService;
