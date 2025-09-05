const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para DocuSeal
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // remove /api prefix
      },
    })
  );

  // Proxy personalizado para descargar archivos de Monday
  app.use('/api/proxy-download', async (req, res) => {
    const { url, token } = req.query;
    
    if (!url || !token) {
      return res.status(400).json({ error: 'URL and token are required' });
    }

    try {
      const fetch = require('node-fetch');
      
      console.log(`🔄 Proxying download from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Monday-DocuSeal-App/1.0',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Copiar headers importantes
      res.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
      res.set('Content-Length', response.headers.get('content-length'));
      
      // Pasar el stream de datos
      response.body.pipe(res);
      
    } catch (error) {
      console.error('Proxy download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  });
};
