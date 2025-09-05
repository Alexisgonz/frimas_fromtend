# Gestor de Firmas DocuSeal para Monday.com

Una aplicación de "Vista de Elemento" (Item View) para Monday.com que permite seleccionar plantillas de documentos PDF, asignar firmantes desde las columnas del ítem, y enviar solicitudes de firma a un servidor DocuSeal auto-alojado.

## 🚀 Características

- **Integración completa con Monday.com**: Lee automáticamente los datos del ítem actual
- **Selección de plantillas**: Conecta con su servidor DocuSeal para obtener plantillas disponibles
- **Mapeo inteligente de firmantes**: Asigna roles de plantillas a contactos del ítem de Monday
- **Previsualización de PDF**: Vista previa no interactiva de los documentos
- **Envío automatizado**: Crea solicitudes de firma con metadatos de Monday
- **Interfaz responsive**: Optimizada para escritorio y móvil

## 📋 Requisitos Previos

1. **Servidor DocuSeal funcionando** con las siguientes APIs disponibles:
   - `GET /api/templates` - Lista de plantillas
   - `GET /api/templates/{id}` - Detalles de plantilla
   - `GET /api/templates/{id}/preview.pdf` - Previsualización PDF
   - `POST /api/submissions` - Crear solicitud de firma

2. **Tablero de Monday.com** con:
   - Columnas de tipo "Email" o "Persona" con direcciones válidas
   - Ítems que representen documentos a firmar

3. **Permisos de desarrollador** en Monday.com para instalar aplicaciones

## 🛠️ Instalación

### 1. Clonar y configurar el proyecto

```bash
git clone <repository-url>
cd docusign-monday-app
npm install
```

### 2. Configurar variables de entorno

Copie el archivo de ejemplo y configure sus valores:

```bash
cp .env.example .env
```

Edite `.env` con la configuración de su servidor DocuSeal:

```env
REACT_APP_DOCUSEAL_BASE_URL=https://docuseal.su-fundacion.org
REACT_APP_DOCUSEAL_API_KEY=su-clave-api-si-es-necesaria
REACT_APP_ENV=production
```

### 3. Compilar para producción

```bash
npm run build
```

### 4. Configurar en Monday.com

1. Vaya a su [Monday.com Developer Center](https://monday.com/developers)
2. Cree una nueva aplicación
3. Agregue una "Item View" con la URL de su aplicación desplegada
4. Configure los permisos necesarios:
   - `boards:read` - Para leer datos del tablero
   - `items:read` - Para leer datos del ítem
   - `notifications:write` - Para mostrar notificaciones

## 📖 Uso

### Desde Monday.com

1. **Abra un ítem** en un tablero que contenga información de contactos
2. **Agregue la vista** "Gestor de Firmas DocuSeal" al ítem
3. **Seleccione una plantilla** del menú desplegable
4. **Asigne firmantes** mapeando cada rol a un contacto del ítem
5. **Revise la previsualización** del documento (opcional)
6. **Envíe a firmar** presionando el botón final

### Estructura de datos esperada

La aplicación busca automáticamente:

**Columnas de Email:**
- Tipo: `email`
- Contenido: Direcciones de correo válidas

**Columnas de Persona:**
- Tipo: `multiple-person` 
- Contenido: Personas con emails asociados

## 🔧 Configuración Avanzada

### Personalizar columnas a buscar

En `mondayService.js`, puede modificar las columnas por defecto:

```javascript
const itemData = await mondayService.getItemData(
  itemId, 
  ['email_column_1', 'email_column_2'], // Columnas de email específicas
  ['people_column_1', 'assignee']       // Columnas de personas específicas
);
```

### Configurar headers adicionales

En `docusealService.js`, puede agregar headers personalizados:

```javascript
this.client = axios.create({
  baseURL: this.baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.apiKey}`,
    'X-Custom-Header': 'valor-personalizado'
  }
});
```

## 🏗️ Arquitectura

```
src/
├── services/
│   ├── mondayService.js     # Integración con Monday.com SDK
│   └── docusealService.js   # Comunicación con DocuSeal API
├── components/
│   ├── SignerMapper.js      # Mapeo de firmantes a roles
│   ├── SignerMapper.css
│   ├── PDFViewer.js         # Previsualización de documentos
│   └── PDFViewer.css
├── App.js                   # Componente principal
└── App.css                  # Estilos principales
```

### Flujo de datos

1. **Inicialización**: App.js carga contexto de Monday y plantillas de DocuSeal
2. **Selección**: Usuario elige plantilla, se cargan detalles y previsualización
3. **Mapeo**: SignerMapper permite asignar contactos a roles de firmantes
4. **Envío**: App.js construye payload y envía a DocuSeal
5. **Confirmación**: Se muestra resultado y se notifica en Monday

## 🔍 Resolución de problemas

### Error: "No se puede conectar al servidor DocuSeal"

- Verifique que `REACT_APP_DOCUSEAL_BASE_URL` sea correcta
- Confirme que el servidor DocuSeal esté funcionando
- Revise configuración de CORS en DocuSeal

### Error: "No se encontraron contactos"

- Asegúrese de que el ítem tenga columnas de tipo "Email" o "Persona"
- Verifique que las direcciones de email sean válidas
- Revise la configuración de columnas en `mondayService.js`

### Error: "Plantilla no encontrada"

- Confirme que existan plantillas en su servidor DocuSeal
- Verifique permisos de API para acceder a plantillas
- Revise logs del servidor DocuSeal

### Error: "No autorizado para acceder a DocuSeal"

- Verifique que `REACT_APP_DOCUSEAL_API_KEY` sea correcta
- Confirme configuración de autenticación en DocuSeal
- Revise headers de autorización en `docusealService.js`

## 🚀 Despliegue

### Opción 1: Netlify

```bash
npm run build
# Suba la carpeta build/ a Netlify
```

### Opción 2: Vercel

```bash
npm run build
vercel --prod
```

### Opción 3: Servidor propio

```bash
npm run build
# Copie build/ a su servidor web
# Configure variables de entorno en el servidor
```

## 🤝 Contribución

1. Fork el proyecto
2. Cree una rama para su feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit sus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abra un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - vea el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico:

1. Revise la documentación anterior
2. Busque en los issues existentes
3. Cree un nuevo issue con:
   - Descripción del problema
   - Pasos para reproducir
   - Logs de error relevantes
   - Configuración de entorno

---

**Desarrollado para fundaciones y organizaciones que necesitan gestionar procesos de firma digital de manera eficiente desde Monday.com**

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
