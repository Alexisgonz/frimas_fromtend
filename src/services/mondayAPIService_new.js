import axios from 'axios';

class MondayAPIService {
  constructor() {
    this.token = process.env.REACT_APP_MONDAY_TOKEN;
    this.baseURL = 'https://api.monday.com/v2';
    this.testBoardId = process.env.REACT_APP_TEST_BOARD_ID;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Ejecuta una consulta GraphQL
   */
  async executeQuery(query, variables = {}) {
    try {
      const response = await this.client.post('/', {
        query,
        variables
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        throw new Error(response.data.errors[0].message);
      }

      return response.data;
    } catch (error) {
      console.error('Monday API error:', error);
      throw error;
    }
  }

  /**
   * Obtiene información del board de pruebas
   */
  async getBoardInfo() {
    const query = `
      query($boardId: ID!) {
        boards(ids: [$boardId]) {
          id
          name
          description
          items_count
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;

    const response = await this.executeQuery(query, { 
      boardId: this.testBoardId 
    });
    
    console.log('Board info response:', response);
    return response.data.boards[0];
  }

  /**
   * Obtiene un ítem específico por ID
   */
  async getItem(itemId) {
    const query = `
      query($itemId: ID!) {
        items(ids: [$itemId]) {
          id
          name
          board {
            id
            name
          }
          column_values {
            id
            type
            text
            value
            column {
              id
              title
              type
            }
          }
        }
      }
    `;

    const response = await this.executeQuery(query, { itemId });
    return response.data.items[0];
  }

  /**
   * Busca un ítem específico por valor de RQ
   */
  async getItemByRQ(boardId, rqValue) {
    const query = `
      query($boardId: ID!) {
        boards(ids: [$boardId]) {
          items_page(limit: 100) {
            items {
              id
              name
              column_values {
                id
                type
                text
                value
                column {
                  id
                  title
                  type
                }
              }
            }
          }
        }
      }
    `;

    try {
      console.log(`🔍 Searching for item with RQ: ${rqValue} in board: ${boardId}`);
      
      const response = await this.executeQuery(query, { boardId });
      const items = response.data.boards[0]?.items_page?.items || [];
      
      console.log(`📋 Found ${items.length} items in board`);
      
      // Buscar el ítem que contenga el RQ específico
      const targetItem = items.find(item => {
        // Buscar en el nombre del ítem
        if (item.name && item.name.includes(rqValue)) {
          console.log(`🎯 Found RQ ${rqValue} in item name: ${item.name}`);
          return true;
        }
        
        // Buscar en las columnas de texto
        return item.column_values.some(column => {
          if (column.text && column.text.includes(rqValue)) {
            console.log(`🎯 Found RQ ${rqValue} in column: ${column.column?.title} - ${column.text}`);
            return true;
          }
          return false;
        });
      });

      if (targetItem) {
        console.log(`✅ Found target item:`, targetItem);
        return targetItem;
      } else {
        console.log(`❌ No item found with RQ: ${rqValue}`);
        return null;
      }
      
    } catch (error) {
      console.error('Error searching for item by RQ:', error);
      throw error;
    }
  }

  /**
   * Extrae emails de las columnas de un ítem
   */
  extractEmailsFromItem(item) {
    const emails = [];

    console.log('🔍 Extracting emails from item columns:', item.column_values);

    item.column_values.forEach(column => {
      // Buscar columnas que contengan "correo" en el título  
      if (column.column && column.column.title.toLowerCase().includes('correo')) {
        console.log(`📧 Found email column: ${column.column.title}`, column);
        
        if (column.text && column.text.trim()) {
          // Extraer emails usando regex
          const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
          const emailMatches = column.text.match(emailRegex);
          
          if (emailMatches) {
            emailMatches.forEach(emailMatch => {
              emails.push({
                columnId: column.id,
                columnTitle: column.column.title,
                email: emailMatch,
                name: emailMatch.split('@')[0],
                fullText: column.text.trim(),
                displayName: `${column.column.title}: ${emailMatch}`
              });
            });
          }
        }
      }

      // También buscar columnas de tipo email
      if (column.type === 'email' && column.text && column.text.trim()) {
        const emailMatch = column.text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
        if (emailMatch) {
          emails.push({
            columnId: column.id,
            columnTitle: column.column?.title || 'Email',
            email: emailMatch[0],
            name: emailMatch[0].split('@')[0],
            fullText: column.text.trim(),
            displayName: `${column.column?.title || 'Email'}: ${emailMatch[0]}`
          });
        }
      }

      // Buscar columnas de tipo person
      if (column.type === 'person' && column.value) {
        try {
          const personData = JSON.parse(column.value);
          if (personData.personsAndTeams) {
            personData.personsAndTeams.forEach(person => {
              if (person.email) {
                emails.push({
                  columnId: column.id,
                  columnTitle: column.column?.title || 'Persona',
                  email: person.email,
                  name: person.name,
                  fullText: `${person.name} <${person.email}>`,
                  displayName: `${column.column?.title || 'Persona'}: ${person.name} (${person.email})`
                });
              }
            });
          }
        } catch (e) {
          console.warn('Error parsing person column:', e);
        }
      }
    });

    console.log('✅ Extracted emails:', emails);
    return emails;
  }

  /**
   * Extrae archivos PDF de las columnas de un ítem
   */
  extractPDFsFromItem(item) {
    const pdfs = [];

    console.log('🔍 Extracting PDFs from item columns:', item.column_values);

    item.column_values.forEach(column => {
      // Buscar columnas que contengan "pdf" en el título
      if (column.column && column.column.title.toLowerCase().includes('pdf')) {
        console.log(`📄 Found PDF column: ${column.column.title}`, column);
        
        if (column.value) {
          try {
            const fileData = JSON.parse(column.value);
            console.log('📁 File data:', fileData);
            
            if (fileData.files) {
              fileData.files.forEach(file => {
                console.log('📎 Processing file:', file);
                if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
                  pdfs.push({
                    columnId: column.id,
                    columnTitle: column.column.title,
                    fileName: file.name,
                    fileUrl: file.url || file.public_url || file.asset_url,
                    fileId: file.id,
                    displayName: `${column.column.title}: ${file.name}`,
                    rawFileData: file // Para debugging
                  });
                }
              });
            } else if (fileData.url || fileData.public_url) {
              // Caso donde el archivo está directamente en el objeto
              pdfs.push({
                columnId: column.id,
                columnTitle: column.column.title,
                fileName: fileData.name || 'documento.pdf',
                fileUrl: fileData.url || fileData.public_url,
                displayName: `${column.column.title}: ${fileData.name || 'documento.pdf'}`,
                rawFileData: fileData
              });
            }
          } catch (e) {
            console.warn('❌ Error parsing file column:', e, column.value);
          }
        }
      }

      // También buscar columnas de tipo file
      if (column.type === 'file' && column.value) {
        console.log(`📂 Found file column: ${column.column?.title}`, column);
        
        try {
          const fileData = JSON.parse(column.value);
          console.log('📁 File type column data:', fileData);
          
          if (fileData.files) {
            fileData.files.forEach(file => {
              console.log('📎 Processing file in file column:', file);
              if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
                pdfs.push({
                  columnId: column.id,
                  columnTitle: column.column?.title || 'Archivo',
                  fileName: file.name,
                  fileUrl: file.url || file.public_url || file.asset_url,
                  fileId: file.id,
                  displayName: `${column.column?.title || 'Archivo'}: ${file.name}`,
                  rawFileData: file
                });
              }
            });
          }
        } catch (e) {
          console.warn('❌ Error parsing file column:', e, column.value);
        }
      }
    });

    console.log('✅ Extracted PDFs:', pdfs);
    return pdfs;
  }

  /**
   * Obtiene datos procesados de un ítem específico por RQ
   */
  async getProcessedItemDataByRQ(boardId, rqValue) {
    try {
      const item = await this.getItemByRQ(boardId, rqValue);
      
      if (!item) {
        throw new Error(`No se encontró ítem con RQ: ${rqValue}`);
      }

      console.log(`🔧 Processing item data for RQ: ${rqValue}`);
      
      const emails = this.extractEmailsFromItem(item);
      const pdfs = this.extractPDFsFromItem(item);
      
      const processedData = {
        id: item.id,
        name: item.name,
        rqValue: rqValue,
        allContacts: emails.map(e => ({
          email: e.email,
          name: e.name || e.email,
          source: 'monday_column',
          columnId: e.columnId,
          columnTitle: e.columnTitle
        })),
        pdfs: pdfs,
        rawData: item,
        boardId: boardId
      };

      console.log(`✅ Processed data for RQ ${rqValue}:`, processedData);
      return processedData;
      
    } catch (error) {
      console.error(`Error processing item data for RQ ${rqValue}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene ítems del board de pruebas
   */
  async getItemsFromBoard(boardId = null, limit = 10) {
    const targetBoardId = boardId || this.testBoardId;
    
    const query = `
      query($boardId: ID!, $limit: Int!) {
        boards(ids: [$boardId]) {
          items_page(limit: $limit) {
            items {
              id
              name
              column_values {
                id
                type
                text
                value
                column {
                  id
                  title
                  type
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.executeQuery(query, { 
      boardId: targetBoardId, 
      limit 
    });
    
    const data = response.data;
    return data.boards[0].items_page.items;
  }

  /**
   * Alias para getItemsFromBoard para compatibilidad
   */
  async listBoardItems(boardId = null, limit = 10) {
    return await this.getItemsFromBoard(boardId, limit);
  }

  /**
   * Obtiene datos procesados de un ítem para pruebas
   */
  async getProcessedItemData(itemId) {
    const item = await this.getItem(itemId);
    const emails = this.extractEmailsFromItem(item);
    const pdfs = this.extractPDFsFromItem(item);

    return {
      id: item.id,
      name: item.name,
      board: item.board,
      emails: emails,
      pdfs: pdfs,
      allContacts: emails.map(e => ({
        email: e.email,
        name: e.name || e.email,
        source: 'monday_column',
        columnId: e.columnId,
        columnTitle: e.columnTitle
      })),
      columnValues: item.column_values
    };
  }

  /**
   * Valida la conexión con Monday
   */
  async validateConnection() {
    try {
      const query = `
        query {
          me {
            id
            name
            email
          }
        }
      `;

      const data = await this.executeQuery(query);
      return {
        isValid: true,
        user: data.me
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }
}

// Exportar instancia única
const mondayAPIService = new MondayAPIService();
export default mondayAPIService;
