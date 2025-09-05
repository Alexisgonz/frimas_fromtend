# Sistema de Descarga Directa de PDFs

## Descripción

Se ha implementado un sistema de descarga directa de archivos PDF desde Monday.com que elimina la necesidad de abrir el navegador para descargar archivos. Este sistema maneja archivos temporales de forma eficiente y proporciona múltiples opciones para la gestión de documentos.

## Características Nuevas

### 1. Descarga Directa 📥
- **Función**: `handleDirectDownload()`
- **Descripción**: Descarga el PDF directamente al dispositivo sin abrir pestañas del navegador
- **Uso**: Hacer clic en "📥 Descargar PDF Directamente"
- **Beneficios**: 
  - No interrumpe el flujo de trabajo
  - Descarga automática
  - Gestión eficiente de memoria

### 2. Vista Previa Temporal 👁️
- **Función**: `handleCreateTempUrl()`
- **Descripción**: Crea una URL temporal para previsualizar el PDF en nueva pestaña
- **Uso**: Hacer clic en "👁️ Vista Previa Temporal"
- **Beneficios**:
  - Vista previa rápida sin descargar
  - URLs temporales que se autodestruyen
  - No consume espacio de almacenamiento

### 3. Gestión de Archivos Temporales

#### Información de Temporales 📋
- **Función**: `handleShowTempInfo()`
- **Descripción**: Muestra información sobre archivos temporales activos
- **Información mostrada**:
  - Número total de archivos temporales
  - Nombre de cada archivo
  - Fecha y hora de creación
  - Tiempo de expiración
  - Tiempo restante

#### Limpieza Manual 🧹
- **Función**: `handleCleanupTempUrls()`
- **Descripción**: Elimina todos los archivos temporales manualmente
- **Beneficios**:
  - Libera memoria instantáneamente
  - Control manual sobre la limpieza
  - Útil para depuración

## Servicios Implementados

### 1. MondayAPIService (Actualizado)
Funciones nuevas:
- `downloadFileAsBlob()`: Descarga archivos como blob
- `downloadPDFDirectly()`: Descarga directa de PDFs (deprecated, usar FileManagerService)
- `createTempBlobUrl()`: Crea URLs temporales (deprecated, usar FileManagerService)

### 2. FileManagerService (Nuevo)
Servicio dedicado para gestión de archivos:
- `downloadBlob()`: Descarga blobs como archivos
- `createPreviewUrl()`: Crea URLs temporales para previsualización
- `openPreview()`: Abre archivos en nueva ventana
- `registerTempUrl()`: Registra URLs para limpieza automática
- `cleanupExpiredUrls()`: Limpieza automática cada 5 minutos
- `cleanupAllTempUrls()`: Limpieza manual de todas las URLs
- `getTempUrlsInfo()`: Información sobre URLs activas

## Flujo de Trabajo

### Descarga Directa
1. Usuario selecciona un PDF de Monday.com
2. Hace clic en "📥 Descargar PDF Directamente"
3. Sistema obtiene el archivo usando `assetId`
4. Crea un blob temporal
5. Trigger automático de descarga
6. Limpieza automática del blob

### Vista Previa Temporal
1. Usuario selecciona un PDF
2. Hace clic en "👁️ Vista Previa Temporal"
3. Sistema crea URL temporal (válida por 5 minutos)
4. Abre PDF en nueva pestaña
5. Limpieza automática después de expiración

## Configuración de Limpieza Automática

- **Intervalo**: Cada 5 minutos
- **Expiración por defecto**: 5 minutos
- **Limpieza al cerrar**: Automática al cerrar la ventana
- **Gestión de memoria**: URLs se revocan automáticamente

## Estilos CSS

Se han agregado estilos específicos para la nueva funcionalidad:
- `.direct-download-section`: Contenedor principal
- `.download-actions`: Contenedor de botones
- `.download-button`: Estilo base para botones
- `.direct-download`, `.temp-preview`, `.temp-info`, `.cleanup`: Estilos específicos por tipo
- Responsive design para dispositivos móviles

## Mensajes de Usuario

El sistema proporciona retroalimentación clara:
- ✅ Mensajes de éxito con detalles del archivo
- ❌ Mensajes de error específicos
- ⏳ Indicadores de proceso en curso
- 📋 Información detallada sobre archivos temporales

## Ventajas del Nuevo Sistema

1. **Experiencia de Usuario Mejorada**:
   - No más pestañas emergentes no deseadas
   - Descargas directas y rápidas
   - Vista previa sin almacenamiento permanente

2. **Gestión Eficiente de Memoria**:
   - Limpieza automática programada
   - Control manual disponible
   - URLs temporales con expiración

3. **Flexibilidad**:
   - Múltiples opciones de gestión de archivos
   - Información detallada disponible
   - Limpieza manual cuando sea necesario

4. **Mantenimiento**:
   - Código modular y reutilizable
   - Servicios separados por responsabilidad
   - Fácil depuración y extensión

## Uso Recomendado

- **Para descarga permanente**: Usar "📥 Descargar PDF Directamente"
- **Para vista rápida**: Usar "👁️ Vista Previa Temporal"
- **Para monitoreo**: Usar "📋 Info Temporales" regularmente
- **Para limpieza**: Usar "🧹 Limpiar Temporales" si es necesario

## Compatibilidad

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Dispositivos móviles (iOS/Android)

## Notas Técnicas

- Los archivos se manejan como blobs en memoria
- Las URLs temporales usan `window.URL.createObjectURL()`
- La limpieza usa `window.URL.revokeObjectURL()`
- El servicio se destruye automáticamente al cerrar la ventana
