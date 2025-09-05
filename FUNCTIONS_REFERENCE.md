# 🔍 Referencia Rápida - Funciones Clave

## 📋 **Índice de Funciones por Archivo**

---

## 🔧 **mondayService.js**

### **Función de Entrada Principal**
```javascript
getContext() → {itemId, boardId, userId, isTestMode, isMockMode}
```
**Uso:** `const context = await mondayService.getContext()`

### **Extracción de Datos**
```javascript
getItemData(itemId) → {name, allContacts, pdfs, rawData}
```
**Uso:** `const data = await mondayService.getItemData('123456')`

### **Procesamiento de Datos**
```javascript
processItemData(rawData) → {allContacts: [], pdfs: []}
```
**Uso:** `const processed = mondayService.processItemData(mondayData)`

### **Notificaciones**
```javascript
showNotification(message, type) → Promise<void>
```
**Uso:** `await mondayService.showNotification('¡Éxito!', 'success')`

---

## 🌐 **mondayAPIService.js**

### **Consulta GraphQL Base**
```javascript
executeQuery(query, variables) → Promise<data>
```
**Ejemplo:**
```javascript
const query = `query { boards(ids: [123]) { name } }`
const result = await mondayAPIService.executeQuery(query)
```

### **Información de Board**
```javascript
getBoardInfo(boardId) → {id, name, columns, items_count}
```
**Uso:** `const board = await mondayAPIService.getBoardInfo('8837207020')`

### **Extracción de Emails**
```javascript
extractEmailsFromItem(item) → [{email: string, name: string, displayName: string}]
```
**Tipos de columna que busca:** `email`, `person`

### **Extracción de PDFs**
```javascript
extractPDFsFromItem(item) → [{name: string, url: string}]
```
**Extensiones válidas:** `.pdf`

---

## 📄 **docusealService.js**

### **Plantillas**
```javascript
getTemplates() → [{id, name, submitters: [{uuid, name}]}]
getTemplateDetails(id) → {id, name, submitters, documents, pdf_url}
```

### **Submisiones Tradicionales**
```javascript
createSubmission(data) → {id, status, submitters, expires_at}
```
**Estructura de data:**
```javascript
{
  template_id: 'template_123',
  submitters: [{name: 'Juan', email: 'juan@email.com', uuid: 'signer_1'}],
  send_email: true,
  metadata: {monday_item_id: '456'}
}
```

### **⭐ Nuevas Funciones para PDFs Directos**

#### **Crear Plantilla desde PDF**
```javascript
createTemplateFromPDF(templateData) → {id, name, submitters, edit_url}
```
**Estructura templateData:**
```javascript
{
  name: 'Mi Plantilla',
  pdfUrl: 'https://monday.com/files/doc.pdf',
  pdfName: 'documento.pdf',
  emails: [{email: 'user@email.com', name: 'Usuario'}],
  mondayItemId: '123',
  mondayBoardId: '456'
}
```

#### **Submisión Directa**
```javascript
createDirectSubmission(submissionData) → {id, slug, status, edit_url, view_url}
```

#### **URL Prellenada**
```javascript
getDocuSealURL(data) → string
```
**Retorna:** `https://docuseal.com/templates/new?document_url=...&submitter_0_email=...`

---

## 🎨 **Componentes React**

### **App.js - Estados Principales**
```javascript
// Estados Monday
const [mondayContext, setMondayContext] = useState(null)
const [mondayItemData, setMondayItemData] = useState(null)

// Estados DocuSeal
const [templates, setTemplates] = useState([])
const [selectedTemplate, setSelectedTemplate] = useState(null)

// Estados DocumentProcessor (NUEVOS)
const [selectedPdf, setSelectedPdf] = useState(null)
const [showDocumentProcessor, setShowDocumentProcessor] = useState(false)
```

### **App.js - Handlers Principales**
```javascript
// Carga inicial
loadInitialData() → Promise<void>

// Selección de plantilla
handleTemplateSelection(templateId) → Promise<void>

// Envío tradicional
handleSubmitSignature() → Promise<void>

// ⭐ NUEVOS - Procesamiento directo
handlePdfSelection(pdf) → void
handleProcessComplete(result) → void
handleProcessError(errorMessage) → void
```

### **DocumentProcessor.js - Props**
```javascript
<DocumentProcessor
  selectedPdf={{name: string, url: string}}
  emails={[{email: string, name: string}]}
  mondayItemId={string}
  mondayBoardId={string}
  docusealService={object}
  onProcessComplete={function}
  onError={function}
/>
```

### **SignerMapper.js - Props**
```javascript
<SignerMapper
  templateSubmitters={[{uuid: string, name: string}]}
  mondayContacts={[{email: string, name: string}]}
  onMappingChange={function}
  mapping={{uuid: {email: string, name: string}}}
/>
```

---

## 🔄 **Flujos de Datos Completos**

### **Flujo 1: Inicio de App**
```
App.loadInitialData() →
  mondayService.getContext() →
  mondayService.getItemData(itemId) →
  docusealService.getTemplates() →
  setState(context, itemData, templates)
```

### **Flujo 2: Procesamiento PDF Directo**
```
User clicks "Procesar con DocuSeal" →
  App.handlePdfSelection(pdf) →
  setSelectedPdf(pdf) + setShowDocumentProcessor(true) →
  
DocumentProcessor renders →
  User selects mode and clicks action →
  
Mode: "Abrir en DocuSeal" →
  docusealService.getDocuSealURL(data) →
  window.open(url)

Mode: "Crear Plantilla" →
  docusealService.createTemplateFromPDF(data) →
  window.open(result.edit_url)

Mode: "Submisión Directa" →
  docusealService.createDirectSubmission(data) →
  window.open(result.edit_url)
```

### **Flujo 3: Mapeo y Envío Tradicional**
```
User selects template →
  App.handleTemplateSelection(templateId) →
  docusealService.getTemplateDetails(templateId) →
  setState(templateDetails)

SignerMapper renders with template roles →
  User maps roles to Monday contacts →
  App.handleMappingChange(newMapping)

User clicks "Enviar para Firma" →
  App.handleSubmitSignature() →
  docusealService.createSubmission(submissionData) →
  setState(submissionResult)
```

---

## 🎯 **Puntos de Entrada Comunes**

### **Para Testing/Debugging:**
```javascript
// Ver contexto actual
console.log('Context:', await mondayService.getContext())

// Ver datos del ítem
console.log('Item Data:', await mondayService.getItemData('itemId'))

// Ver plantillas disponibles
console.log('Templates:', await docusealService.getTemplates())
```

### **Para Configuración:**
```javascript
// Variables de entorno importantes
process.env.REACT_APP_DOCUSEAL_BASE_URL     // URL DocuSeal
process.env.REACT_APP_DOCUSEAL_API_KEY      // API Key DocuSeal
process.env.REACT_APP_MONDAY_TOKEN          // Token Monday (testing)
process.env.REACT_APP_TEST_BOARD_ID         // Board ID (testing)
```

### **Para Manejo de Errores:**
```javascript
// Todos los servicios tienen try/catch
// Errores se logean en console y se propagan
// App.js maneja errores globales con setError(message)
// mondayService.showNotification() para UX
```

---

## 🚀 **Comandos de Desarrollo**

### **Inicio Local:**
```bash
npm start                    # Puerto 3001 (3000 ocupado por DocuSeal)
```

### **Build de Producción:**
```bash
npm run build               # Genera carpeta build/
```

### **Testing de Integración:**
```bash
# 1. Configurar .env con URLs y tokens reales
# 2. npm start
# 3. Abrir http://localhost:3001
# 4. Usar TestModeSelector para cambiar ítems
```

---

## 📝 **Checklist de Funcionalidad**

### **✅ Implementado:**
- [x] Extracción de emails de Monday
- [x] Extracción de PDFs de Monday  
- [x] Integración con plantillas DocuSeal
- [x] Mapeo de firmantes
- [x] Submisiones tradicionales
- [x] **NUEVO:** Procesamiento directo de PDFs
- [x] **NUEVO:** Creación de plantillas desde PDF
- [x] **NUEVO:** Submisiones directas
- [x] **NUEVO:** URLs prellenadas de DocuSeal
- [x] Modo de pruebas con datos reales
- [x] Modo mock para desarrollo
- [x] UI responsive y completa

### **🔧 Por Configurar:**
- [ ] URL y API key reales de DocuSeal
- [ ] Testing completo del flujo PDF → DocuSeal
- [ ] Deployment en servidor público
- [ ] Configuración en Monday App Center

---

*📋 Esta referencia cubre todas las funciones y flujos principales del proyecto.*
*🔍 Usa Ctrl+F para buscar funciones específicas.*
