/**
 * Servicio para gestión de archivos temporales y descargas directas
 */
class FileManagerService {
  constructor() {
    this.tempUrls = new Map(); // Para rastrear URLs temporales
    this.cleanupInterval = null;
    this.startCleanupScheduler();
  }

  /**
   * Inicia el programador de limpieza automática
   */
  startCleanupScheduler() {
    // Limpiar URLs temporales cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredUrls();
    }, 300000); // 5 minutos
  }

  /**
   * Detiene el programador de limpieza
   */
  stopCleanupScheduler() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Registra una URL temporal para limpieza automática
   */
  registerTempUrl(url, fileName, expireTime = 300000) { // 5 minutos por defecto
    const expireAt = Date.now() + expireTime;
    this.tempUrls.set(url, {
      fileName,
      expireAt,
      created: Date.now()
    });
    
    console.log(`📝 URL temporal registrada: ${fileName} (expira en ${expireTime / 1000}s)`);
  }

  /**
   * Limpia URLs temporales expiradas
   */
  cleanupExpiredUrls() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [url, data] of this.tempUrls.entries()) {
      if (now > data.expireAt) {
        try {
          window.URL.revokeObjectURL(url);
          this.tempUrls.delete(url);
          cleanedCount++;
          console.log(`🧹 URL temporal limpiada: ${data.fileName}`);
        } catch (error) {
          console.warn('⚠️ Error limpiando URL temporal:', error);
          this.tempUrls.delete(url); // Remover de la lista de todos modos
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Limpieza completada: ${cleanedCount} URLs temporales eliminadas`);
    }
  }

  /**
   * Limpia una URL temporal específica
   */
  cleanupTempUrl(url) {
    if (this.tempUrls.has(url)) {
      try {
        window.URL.revokeObjectURL(url);
        const data = this.tempUrls.get(url);
        this.tempUrls.delete(url);
        console.log(`🧹 URL temporal limpiada manualmente: ${data.fileName}`);
        return true;
      } catch (error) {
        console.warn('⚠️ Error limpiando URL temporal:', error);
        this.tempUrls.delete(url);
        return false;
      }
    }
    return false;
  }

  /**
   * Descarga un blob como archivo
   */
  downloadBlob(blob, fileName, mimeType = 'application/pdf') {
    try {
      console.log(`📥 Iniciando descarga de: ${fileName}`);

      // Crear URL temporal para el blob
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));

      // Crear elemento de descarga temporal
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      downloadLink.style.display = 'none';

      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Limpiar la URL temporal después de un tiempo
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      console.log(`✅ Descarga completada: ${fileName}`);
      
      return {
        success: true,
        fileName: fileName,
        size: blob.size || 0
      };

    } catch (error) {
      console.error('❌ Error en descarga:', error);
      throw error;
    }
  }

  /**
   * Crea una URL temporal para previsualización
   */
  createPreviewUrl(blob, fileName, mimeType = 'application/pdf', expireTime = 300000) {
    try {
      console.log(`🔗 Creando URL de previsualización para: ${fileName}`);

      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
      
      // Registrar para limpieza automática
      this.registerTempUrl(blobUrl, fileName, expireTime);

      console.log(`✅ URL de previsualización creada: ${fileName}`);
      
      return {
        success: true,
        blobUrl: blobUrl,
        fileName: fileName,
        size: blob.size || 0,
        type: mimeType,
        expireAt: Date.now() + expireTime
      };

    } catch (error) {
      console.error('❌ Error creando URL de previsualización:', error);
      throw error;
    }
  }

  /**
   * Abre un archivo en nueva ventana para previsualización
   */
  openPreview(blobUrl, fileName) {
    try {
      const previewWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      
      if (previewWindow) {
        console.log(`👁️ Vista previa abierta: ${fileName}`);
        return true;
      } else {
        console.warn('⚠️ No se pudo abrir la vista previa (pop-ups bloqueados?)');
        return false;
      }
    } catch (error) {
      console.error('❌ Error abriendo vista previa:', error);
      return false;
    }
  }

  /**
   * Obtiene información sobre URLs temporales activas
   */
  getTempUrlsInfo() {
    const info = {
      totalUrls: this.tempUrls.size,
      urls: []
    };

    for (const [url, data] of this.tempUrls.entries()) {
      info.urls.push({
        fileName: data.fileName,
        created: new Date(data.created).toLocaleString(),
        expiresAt: new Date(data.expireAt).toLocaleString(),
        timeLeft: Math.max(0, data.expireAt - Date.now())
      });
    }

    return info;
  }

  /**
   * Limpia todas las URLs temporales
   */
  cleanupAllTempUrls() {
    let cleanedCount = 0;

    for (const [url, data] of this.tempUrls.entries()) {
      try {
        window.URL.revokeObjectURL(url);
        cleanedCount++;
        console.log(`🧹 URL temporal limpiada: ${data.fileName}`);
      } catch (error) {
        console.warn('⚠️ Error limpiando URL temporal:', error);
      }
    }

    this.tempUrls.clear();
    console.log(`🧹 Limpieza total completada: ${cleanedCount} URLs eliminadas`);
    
    return cleanedCount;
  }

  /**
   * Destructor del servicio
   */
  destroy() {
    this.stopCleanupScheduler();
    this.cleanupAllTempUrls();
    console.log('🗑️ FileManagerService destruido');
  }
}

// Exportar instancia única
const fileManagerService = new FileManagerService();

// Limpiar al cerrar la ventana
window.addEventListener('beforeunload', () => {
  fileManagerService.destroy();
});

export default fileManagerService;
