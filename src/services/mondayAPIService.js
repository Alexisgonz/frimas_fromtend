import axios from 'axios';

class MondayAPIService {
  constructor() {
    this.token = process.env.REACT_APP_MONDAY_TOKEN;
    this.baseURL = 'https://api.monday.com/v2';
    this.testBoardId = process.env.REACT_APP_TEST_BOARD_ID;
    
    // Configuración de columnas sugeridas para mostrar
    this.suggestedColumns = {
      emails: [
        'Solicitado Por-correo',
        'Autorizado Por (Líder Proceso)-correo', 
        'Aprobado por (económica)-correo',
        'Recibido y Revisado Por-correo',
        'Aprobado Por (Gerencia)-correo'
      ],
      files: [
        'pdf'
      ]
    };
    
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
    const item = response.data.items[0];
    
    // Aplicar filtro de columnas sugeridas
    return this.filterSuggestedColumns(item);
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
   * Filtra las columnas del item para mostrar solo las sugeridas
   */
  filterSuggestedColumns(item) {
    if (!item || !item.column_values) {
      return item;
    }

    const suggestedColumnTitles = [
      ...this.suggestedColumns.emails,
      ...this.suggestedColumns.files
    ];

    const filteredColumns = item.column_values.filter(column => {
      if (!column.column || !column.column.title) return false;
      
      const title = column.column.title;
      
      // Incluir si es una columna sugerida exacta
      if (suggestedColumnTitles.includes(title)) {
        return true;
      }
      
      // Incluir si contiene "correo" y no está vacía
      if (title.toLowerCase().includes('correo') && column.text && column.text.trim()) {
        return true;
      }
      
      // Incluir si contiene "pdf" y no está vacía
      if (title.toLowerCase().includes('pdf') && column.value && column.value.trim()) {
        return true;
      }
      
      return false;
    });

    console.log(`📋 Filtered ${item.column_values.length} columns to ${filteredColumns.length} suggested columns`);

    return {
      ...item,
      column_values: filteredColumns,
      all_column_values: item.column_values // Guardar referencia a todas las columnas
    };
  }

  /**
   * Extrae emails de las columnas de un ítem
   */
  extractEmailsFromItem(item) {
    const emails = [];

    // Validar que el item y column_values existen
    if (!item || !item.column_values) {
      console.warn('⚠️ Item sin column_values:', item?.name || 'Unknown');
      return emails;
    }

    console.log(`� Extrayendo emails del item: ${item.name}`);

    item.column_values.forEach(column => {
      // Buscar columnas que contengan "correo" en el título  
      if (column.column && column.column.title.toLowerCase().includes('correo')) {
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
            console.log(`✅ ${emailMatches.length} email(s) en: ${column.column.title}`);
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

    console.log(`📧 Total emails extraídos: ${emails.length}`);
    return emails;
  }

  /**
   * Extrae archivos PDF de las columnas de un ítem
   */
  extractPDFsFromItem(item) {
    const pdfs = [];

    console.log('🔍 Extracting PDFs from item:', item);

    // Validar que el item y column_values existen
    if (!item || !item.column_values) {
      console.warn('⚠️ Item sin column_values:', item?.name || 'Unknown');
      return pdfs;
    }

    console.log(`� Extrayendo PDFs del item: ${item.name}`);

    item.column_values.forEach(column => {
      // Buscar columnas que contengan "pdf" en el título
      if (column.column && column.column.title.toLowerCase().includes('pdf')) {
        if (column.value) {
          try {
            const fileData = JSON.parse(column.value);
            
            if (fileData.files) {
              fileData.files.forEach(file => {
                if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
                  // Usar assetId para construir URL pública
                  let fileUrl = file.url || file.public_url || file.asset_url;
                  
                  // Si no hay URL pero hay assetId, usar la API de assets de Monday
                  if (!fileUrl && file.assetId) {
                    fileUrl = `https://files.monday.com/v2/assets/${file.assetId}`;
                  }
                  
                  pdfs.push({
                    columnId: column.id,
                    columnTitle: column.column.title,
                    fileName: file.name,
                    fileUrl: fileUrl,
                    fileId: file.id || file.assetId,
                    assetId: file.assetId,
                    displayName: `${column.column.title}: ${file.name}`,
                    rawFileData: file
                  });
                  console.log(`✅ PDF encontrado: ${file.name}`);
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
        try {
          const fileData = JSON.parse(column.value);
          
          if (fileData.files) {
            fileData.files.forEach(file => {
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
                console.log(`✅ PDF encontrado: ${file.name}`);
              }
            });
          }
        } catch (e) {
          console.warn('❌ Error parsing file column:', e);
        }
      }
    });

    console.log(`📄 Total PDFs extraídos: ${pdfs.length}`);
    return pdfs;
  }

  /**
   * Extrae PDFs de las columnas de un ítem con información de descarga
   */
  async extractPDFsFromItemWithDownloadInfo(item) {
    const pdfs = [];

    // Validar que el item y column_values existen
    if (!item || !item.column_values) {
      console.warn('⚠️ Item sin column_values:', item?.name || 'Unknown');
      return pdfs;
    }

    console.log(`📄 Obteniendo info de descarga para PDFs del item: ${item.name}`);

    for (const column of item.column_values) {
      // Buscar columnas que contengan "pdf" en el título
      if (column.column && column.column.title.toLowerCase().includes('pdf')) {
        if (column.value) {
          try {
            const fileData = JSON.parse(column.value);
            
            if (fileData.files) {
              for (const file of fileData.files) {
                if (file.name && file.name.toLowerCase().endsWith('.pdf')) {
                  let pdfInfo = null;
                  let fileName = file.name;
                  
                  // Si hay assetId, obtener información del archivo
                  if (file.assetId) {
                    try {
                      pdfInfo = await this.getOrDownloadPDF(file.assetId);
                      fileName = pdfInfo.name || file.name;
                      console.log(`✅ Info obtenida para: ${fileName}`);
                    } catch (error) {
                      console.warn(`⚠️ Error obteniendo info del PDF ${file.assetId}:`, error.message);
                    }
                  }
                  
                  pdfs.push({
                    columnId: column.id,
                    columnTitle: column.column.title,
                    fileName: fileName,
                    downloadUrl: pdfInfo?.downloadUrl,
                    canAutoDownload: pdfInfo?.canAutoDownload || false,
                    fileId: file.id || file.assetId,
                    assetId: file.assetId,
                    displayName: `${column.column.title}: ${fileName}`,
                    rawFileData: file,
                    pdfInfo: pdfInfo
                  });
                }
              }
            }
          } catch (e) {
            console.warn('❌ Error procesando columna PDF:', e.message);
          }
        }
      }
    }

    console.log(`📄 PDFs con info de descarga: ${pdfs.length}`);
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

      console.log(`🔧 Procesando item con RQ: ${rqValue} - ${item.name}`);
      
      const emails = this.extractEmailsFromItem(item);
      const pdfs = await this.extractPDFsFromItemWithDownloadInfo(item);
      
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

      console.log(`✅ Item procesado - Emails: ${emails.length}, PDFs: ${pdfs.length}`);
      return processedData;
      
    } catch (error) {
      console.error(`❌ Error procesando RQ ${rqValue}:`, error.message);
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
    const items = data.boards[0].items_page.items;
    
    // Aplicar filtro de columnas sugeridas a todos los items
    return items.map(item => this.filterSuggestedColumns(item));
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
    const pdfs = await this.extractPDFsFromItemWithDownloadInfo(item);

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
   * Obtiene la URL pública de un asset de Monday
   */
  async getAssetUrl(assetId) {
    try {
      const query = `
        query($assetId: ID!) {
          assets(ids: [$assetId]) {
            id
            name
            url
            public_url
            file_extension
          }
        }
      `;

      const response = await this.executeQuery(query, { assetId: assetId.toString() });
      const asset = response.data.assets[0];
      
      if (asset) {
        return asset.public_url || asset.url;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting asset URL:', error);
      return null;
    }
  }

  /**
   * Intenta obtener el PDF como base64, o proporciona la URL para descarga manual
   */
  async getOrDownloadPDF(assetId) {
    try {
      console.log(`📥 Obteniendo info del PDF: ${assetId}`);
      
      // Obtener información del asset
      const assetQuery = `
        query($assetId: ID!) {
          assets(ids: [$assetId]) {
            id
            name
            url
            file_extension
            file_size
          }
        }
      `;

      const assetResponse = await this.executeQuery(assetQuery, { assetId: assetId.toString() });
      const asset = assetResponse.data.assets[0];
      
      if (!asset) {
        throw new Error(`Asset ${assetId} not found`);
      }
      
      console.log(`📁 PDF: ${asset.name} (${asset.file_size} bytes)`);
      
      return {
        id: asset.id,
        name: asset.name,
        downloadUrl: asset.url,
        fileExtension: asset.file_extension,
        fileSize: asset.file_size,
        mimeType: this.getMimeType(asset.file_extension),
        canAutoDownload: false // Indica que necesita descarga manual
      };
      
    } catch (error) {
      console.error(`❌ Error obteniendo info del PDF:`, error.message);
      throw error;
    }
  }

  /**
   * Convierte un blob a base64
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remover el prefijo data:...;base64,
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Obtiene el MIME type basado en la extensión del archivo
   */
  getMimeType(extension) {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
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

  /**
   * Descarga un archivo de Monday usando el assetId y lo convierte a base64
   */
  async downloadFileAsBase64(assetId) {
    try {
      console.log(`📥 Downloading file with assetId: ${assetId}`);
      
      const response = await this.client.get(`https://files.monday.com/v2/assets/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        responseType: 'arraybuffer'
      });

      // Convertir a base64
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      console.log(`✅ File downloaded and converted to base64 (${base64.length} characters)`);
      
      return base64;
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Obtiene el contenido base64 de un PDF desde Monday
   */
  async getPDFAsBase64(pdfData) {
    if (pdfData.rawFileData && pdfData.rawFileData.assetId) {
      return await this.downloadFileAsBase64(pdfData.rawFileData.assetId);
    }
    throw new Error('No assetId found in PDF data');
  }

  /**
   * Descarga un archivo directamente como blob
   */
  async downloadFileAsBlob(assetId, fileName = 'documento.pdf') {
    try {
      console.log(`📥 Descargando archivo con assetId: ${assetId}`);
      
      const response = await this.client.get(`https://files.monday.com/v2/assets/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        responseType: 'blob'
      });

      console.log(`✅ Archivo descargado como blob`);
      
      return {
        blob: response.data,
        fileName: fileName,
        size: response.data.size,
        type: response.data.type || 'application/pdf'
      };
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      throw error;
    }
  }

  /**
   * Descarga directa de un archivo PDF sin abrir el navegador
   */
  async downloadPDFDirectly(pdfData, fileName) {
    try {
      if (!pdfData.rawFileData || !pdfData.rawFileData.assetId) {
        throw new Error('No se encontró assetId en los datos del PDF');
      }

      const fileData = await this.downloadFileAsBlob(
        pdfData.rawFileData.assetId, 
        fileName || pdfData.fileName || 'documento.pdf'
      );

      // Crear URL temporal para el blob
      const blobUrl = window.URL.createObjectURL(fileData.blob);

      // Crear elemento de descarga temporal
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileData.fileName;
      downloadLink.style.display = 'none';

      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Limpiar la URL temporal después de un tiempo
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      console.log(`✅ Descarga directa completada: ${fileData.fileName}`);
      
      return {
        success: true,
        fileName: fileData.fileName,
        size: fileData.size,
        blobUrl: blobUrl
      };

    } catch (error) {
      console.error('❌ Error en descarga directa:', error);
      throw error;
    }
  }

  /**
   * Crea un blob temporal para previsualización
   */
  async createTempBlobUrl(pdfData) {
    try {
      if (!pdfData.rawFileData || !pdfData.rawFileData.assetId) {
        throw new Error('No se encontró assetId en los datos del PDF');
      }

      const fileData = await this.downloadFileAsBlob(pdfData.rawFileData.assetId);
      const blobUrl = window.URL.createObjectURL(fileData.blob);

      console.log(`✅ URL temporal creada para previsualización`);
      
      return {
        blobUrl: blobUrl,
        fileName: fileData.fileName,
        size: fileData.size,
        type: fileData.type
      };

    } catch (error) {
      console.error('❌ Error creando URL temporal:', error);
      throw error;
    }
  }
}

// Exportar instancia única
const mondayAPIService = new MondayAPIService();
export default mondayAPIService;
