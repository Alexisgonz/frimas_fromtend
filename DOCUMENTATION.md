# 📋 Documentación - DocuSeal Monday.com Integration App

## 🎯 **Descripción General**
Esta aplicación integra Monday.com con DocuSeal para automatizar procesos de firma de documentos. Extrae emails de columnas específicas de Monday y permite enviar PDFs a DocuSeal para su firma.

---

## 📁 **Estructura del Proyecto**

```
docusign-monday-app/
├── public/                     # Archivos públicos estáticos
├── src/
│   ├── components/            # Componentes React reutilizables
│   ├── services/             # Servicios de integración con APIs
│   ├── App.js               # Componente principal de la aplicación
│   ├── App.css              # Estilos globales
│   └── index.js             # Punto de entrada de React
├── package.json             # Dependencias y scripts
├── .env                     # Variables de entorno
└── README.md               # Información básica del proyecto
```

---

## 🔧 **Servicios (src/services/)**

### **1. mondayService.js**
**Propósito:** Servicio principal para integración con Monday.com

#### **Funciones Principales:**

##### `getContext()`
```javascript
async getContext()
```
- **Función:** Obtiene el contexto actual de Monday.com (itemId, boardId, userId)
- **Retorna:** Objeto con información del contexto
- **Uso:** Detecta si está en Monday app o modo de pruebas
- **Estados:** Monday SDK, API Token, o Mock data

##### `getItemData(itemId)`
```javascript
async getItemData(itemId)
```
- **Función:** Extrae datos completos de un ítem de Monday
- **Parámetros:** `itemId` - ID del ítem a consultar
- **Retorna:** Objeto con name, allContacts, pdfs, rawData
- **Proceso:** 
  1. Obtiene datos del ítem via SDK o API
  2. Extrae emails de columnas específicas
  3. Busca archivos PDF en el ítem
  4. Procesa y estructura la información

##### `processItemData(itemData)`
```javascript
processItemData(itemData)
```
- **Función:** Procesa datos raw del ítem para extraer información útil
- **Extrae:** Emails de columnas de tipo email/person
- **Busca:** Archivos PDF en assets
- **Filtra:** Solo emails válidos y archivos PDF

##### `showNotification(message, type)`
```javascript
async showNotification(message, type = 'success')
```
- **Función:** Muestra notificaciones en Monday.com
- **Parámetros:** 
  - `message`: Texto a mostrar
  - `type`: 'success', 'error', 'info'

---

### **2. mondayAPIService.js**
**Propósito:** Comunicación directa con Monday GraphQL API

#### **Funciones Principales:**

##### `executeQuery(query, variables)`
```javascript
async executeQuery(query, variables = {})
```
- **Función:** Ejecuta consultas GraphQL contra Monday API
- **Autenticación:** Usa token de API desde .env
- **Manejo de errores:** Logs detallados y propagación

##### `getBoardInfo(boardId)`
```javascript
async getBoardInfo(boardId)
```
- **Función:** Obtiene información completa de un board
- **Retorna:** Estructura del board, columnas, configuración
- **Uso:** Para entender la estructura antes de extraer datos

##### `getItemsFromBoard(boardId, limit)`
```javascript
async getItemsFromBoard(boardId, limit = 10)
```
- **Función:** Obtiene ítems de un board específico
- **Paginación:** Controlada por parámetro limit
- **Optimización:** Solo campos necesarios

##### `extractEmailsFromItem(item)`
```javascript
extractEmailsFromItem(item)
```
- **Función:** Extrae emails de columnas de un ítem
- **Tipos de columna:** email, person
- **Validación:** Formato de email válido
- **Estructura:** Retorna array de objetos {email, name, displayName}

##### `extractPDFsFromItem(item)`
```javascript
extractPDFsFromItem(item)
```
- **Función:** Extrae archivos PDF de assets del ítem
- **Filtro:** Solo archivos .pdf
- **Retorna:** Array con {name, url} de PDFs encontrados

---

### **3. docusealService.js**
**Propósito:** Integración con servidor DocuSeal para firmas

#### **Configuración:**
```javascript
constructor() {
  this.baseURL = process.env.REACT_APP_DOCUSEAL_BASE_URL || 'http://localhost:3000'
  this.apiKey = process.env.REACT_APP_DOCUSEAL_API_KEY
}
```

#### **Funciones Principales:**

##### `getTemplates()`
```javascript
async getTemplates()
```
- **Función:** Obtiene plantillas disponibles en DocuSeal
- **Retorna:** Array de plantillas con id, name, submitters
- **Fallback:** Datos mock si no hay conexión

##### `getTemplateDetails(templateId)`
```javascript
async getTemplateDetails(templateId)
```
- **Función:** Obtiene detalles completos de una plantilla
- **Include:** Submitters, documentos, configuración
- **PDF URL:** Genera URL de preview del PDF

##### `createSubmission(submissionData)`
```javascript
async createSubmission(submissionData)
```
- **Función:** Crea nueva submisión para firmas
- **Parámetros:** template_id, submitters, send_email, metadata
- **Retorna:** ID de submisión, estado, URLs

##### `createTemplateFromPDF(templateData)` ⭐ **NUEVA**
```javascript
async createTemplateFromPDF(templateData)
```
- **Función:** Crea plantilla directamente desde PDF de Monday
- **Parámetros:** 
  - `name`: Nombre de la plantilla
  - `pdfUrl`: URL del PDF desde Monday
  - `emails`: Array de emails extraídos
  - `mondayItemId`: ID del ítem origen
- **Retorna:** Plantilla creada con edit_url

##### `createDirectSubmission(submissionData)` ⭐ **NUEVA**
```javascript
async createDirectSubmission(submissionData)
```
- **Función:** Crea submisión directa sin plantilla previa
- **Ventaja:** Proceso más rápido para documentos únicos
- **Automapping:** Asigna roles automáticamente a emails

##### `getDocuSealURL(data)` ⭐ **NUEVA**
```javascript
getDocuSealURL(data)
```
- **Función:** Genera URL para abrir DocuSeal con datos prellenados
- **Parámetros URL:** document_url, submitter names/emails
- **Uso:** Abre DocuSeal en nueva ventana con información lista

---

## 🎨 **Componentes (src/components/)**

### **1. SignerMapper.js**
**Propósito:** Mapeo de roles de plantilla con contactos de Monday

#### **Props:**
- `templateSubmitters`: Roles requeridos en plantilla
- `mondayContacts`: Contactos disponibles de Monday
- `onMappingChange`: Callback para cambios
- `mapping`: Estado actual del mapeo

#### **Funcionalidad:**
- Dropdown para cada rol de plantilla
- Selección de contacto de Monday correspondiente
- Validación de asignaciones completas
- UI intuitiva con colores por estado

---

### **2. PDFViewer.js**
**Propósito:** Visualización de PDFs de plantillas DocuSeal

#### **Implementación:**
```javascript
// Simplificado a iframe por compatibilidad
<iframe 
  src={pdfUrl} 
  title={templateName}
  style={{width: '100%', height: '600px'}}
/>
```

#### **Características:**
- Vista previa de plantillas
- Manejo de errores de carga
- Responsive design
- Fallback para URLs inválidas

---

### **3. TestModeSelector.js**
**Propósito:** Selector para testing con diferentes ítems

#### **Funcionalidad:**
- Dropdown con ítems de board de prueba
- Cambio dinámico de ítem activo
- Indicadores visuales de modo de prueba
- Información de contexto actual

---

### **4. DocumentProcessor.js** ⭐ **NUEVO**
**Propósito:** Procesamiento directo de PDFs de Monday a DocuSeal

#### **Props:**
- `selectedPdf`: PDF seleccionado de Monday
- `emails`: Emails extraídos del ítem
- `mondayItemId`: ID del ítem origen
- `docusealService`: Instancia del servicio
- `onProcessComplete`: Callback de éxito
- `onError`: Callback de error

#### **Funcionalidades:**

##### **Modos de Procesamiento:**
1. **Abrir en DocuSeal:** URL prellenada en nueva ventana
2. **Crear Plantilla:** Plantilla reutilizable en DocuSeal
3. **Submisión Directa:** Proceso inmediato de firma

##### **UI Elements:**
- Información del PDF seleccionado
- Lista de emails que se enviarán
- Radio buttons para seleccionar modo
- Botones de acción específicos
- Feedback de resultados

---

## 🎮 **Componente Principal (src/App.js)**

### **Estados Principales:**

#### **Estados de Monday:**
```javascript
const [mondayContext, setMondayContext] = useState(null)      // Contexto de Monday
const [mondayItemData, setMondayItemData] = useState(null)    // Datos del ítem
```

#### **Estados de DocuSeal:**
```javascript
const [templates, setTemplates] = useState([])               // Plantillas disponibles
const [selectedTemplate, setSelectedTemplate] = useState(null) // Plantilla seleccionada
const [templateDetails, setTemplateDetails] = useState(null)  // Detalles completos
```

#### **Estados de DocumentProcessor:** ⭐ **NUEVOS**
```javascript
const [selectedPdf, setSelectedPdf] = useState(null)         // PDF seleccionado
const [showDocumentProcessor, setShowDocumentProcessor] = useState(false)
const [processingResult, setProcessingResult] = useState(null)
```

### **Funciones Principales:**

#### `loadInitialData()`
```javascript
async loadInitialData()
```
- **Flujo de inicio:** 
  1. Obtiene contexto de Monday
  2. Carga datos del ítem actual
  3. Obtiene plantillas de DocuSeal
  4. Maneja errores y estados de carga

#### `handleTemplateSelection(templateId)`
```javascript
async handleTemplateSelection(templateId)
```
- **Función:** Selecciona plantilla y carga detalles
- **Acciones:** 
  1. Obtiene detalles completos
  2. Genera URL de preview
  3. Resetea mapeo anterior

#### `handleSubmitSignature()`
```javascript
async handleSubmitSignature()
```
- **Función:** Envía submisión a DocuSeal
- **Validaciones:** 
  1. Plantilla seleccionada
  2. Mapeo completo de firmantes
  3. Datos válidos
- **Proceso:** Crea submisión y muestra resultado

#### `handlePdfSelection(pdf)` ⭐ **NUEVA**
```javascript
const handlePdfSelection = (pdf)
```
- **Función:** Selecciona PDF para procesamiento directo
- **Acciones:** 
  1. Guarda PDF seleccionado
  2. Muestra DocumentProcessor
  3. Resetea resultados anteriores

#### `handleProcessComplete(result)` ⭐ **NUEVA**
```javascript
const handleProcessComplete = (result)
```
- **Función:** Maneja resultado exitoso de procesamiento
- **Acciones:** 
  1. Guarda resultado
  2. Muestra notificación de éxito
  3. Logs para debugging

---

## 🎨 **Estilos (src/App.css)**

### **Secciones de Estilos:**

#### **1. Base Styles (.App)**
- Layout principal con max-width 1200px
- Font family sistema
- Background color y padding
- Responsive design

#### **2. Header Styles (.app-header)**
- Gradiente azul de Monday.com
- Información del ítem y contexto
- Badges para modo de prueba
- Box shadows y border radius

#### **3. Section Styles**
- `.template-selection`: Dropdown y selección
- `.signer-assignment`: Mapeo de firmantes
- `.submission-section`: Botones de envío
- `.available-pdfs`: ⭐ **NUEVO** Grid de PDFs
- `.document-processor-section`: ⭐ **NUEVO** Panel de procesamiento

#### **4. Component Styles**
- `.pdf-card`: Tarjetas de PDF con hover effects
- `.process-pdf-button`: Botones de acción con gradientes
- `.emails-summary`: Resumen de emails con border izquierdo
- `.processing-result`: Feedback de resultados

#### **5. Responsive Design**
- Media queries para móviles
- Grid adaptativo
- Botones full-width en pantallas pequeñas

---

## ⚙️ **Configuración (.env)**

### **Variables de Entorno:**

```bash
# DocuSeal Configuration
REACT_APP_DOCUSEAL_BASE_URL=http://localhost:3000    # URL del servidor DocuSeal
REACT_APP_DOCUSEAL_API_KEY=                          # API key para autenticación

# Monday.com Testing
REACT_APP_MONDAY_TOKEN=eyJhbGc...                    # Token de API para pruebas
REACT_APP_TEST_BOARD_ID=8837207020                   # Board ID para testing
REACT_APP_USE_REAL_MONDAY=true                       # Usar datos reales vs mock

# Environment
REACT_APP_ENV=development                            # Modo de desarrollo
```

---

## 🔄 **Flujos de Trabajo**

### **Flujo 1: Procesamiento con Plantillas Existentes**
1. Usuario abre app desde ítem de Monday
2. App extrae emails y PDFs del ítem
3. Usuario selecciona plantilla de DocuSeal
4. Sistema mapea roles con contactos de Monday
5. Usuario envía submisión
6. DocuSeal procesa y notifica firmantes

### **Flujo 2: Procesamiento Directo de PDFs** ⭐ **NUEVO**
1. Usuario ve PDFs disponibles en ítem
2. Selecciona PDF específico
3. Elige modo de procesamiento:
   - Abrir en DocuSeal (manual)
   - Crear plantilla (reutilizable)
   - Submisión directa (inmediata)
4. Sistema ejecuta acción seleccionada
5. DocuSeal abre con datos prellenados

### **Flujo 3: Modo de Pruebas**
1. App detecta falta de contexto Monday
2. Usa token de API para datos reales
3. O usa datos mock para development
4. Permite testing completo sin Monday app

---

## 🚀 **Scripts de NPM**

```bash
npm start          # Servidor de desarrollo (puerto 3001)
npm run build      # Build de producción
npm test           # Ejecutar tests
npm run eject      # Eyectar configuración (¡cuidado!)
```

---

## 📝 **Notas de Desarrollo**

### **Características Técnicas:**
- **React 19.1.1** con Hooks
- **monday-sdk-js** para integración oficial
- **axios** para llamadas HTTP
- **CSS Grid/Flexbox** para layouts
- **Error boundaries** para manejo de errores

### **Patrones de Código:**
- **Functional Components** con useState/useEffect
- **Service Layer** para lógica de negocio
- **Prop drilling** controlado con callbacks
- **CSS BEM-like** naming para estilos

### **Testing Strategy:**
- **Tres modos:** Monday SDK, API directa, Mock data
- **Environment switching** via variables
- **Console logging** para debugging
- **Error handling** comprehensivo

---

## 🔧 **Próximos Pasos Sugeridos**

1. **Configurar DocuSeal** real con URL y API key
2. **Testing completo** del flujo PDF → DocuSeal
3. **Build de producción** y hosting
4. **Publicación en Monday App Store**
5. **Documentación de usuario** final

---

*📅 Última actualización: Septiembre 2025*
*🔧 Versión: 1.0.0*
*👨‍💻 Estado: Desarrollo completo, listo para testing con DocuSeal real*
