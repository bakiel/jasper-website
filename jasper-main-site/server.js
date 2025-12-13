/**
 * JASPER Main Website - Static Server
 * Serves the Vite-built static files
 * Port: 3001
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable gzip compression
app.use(compression());

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true
}));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
============================================
JASPER Main Website Server
============================================
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Time: ${new Date().toISOString()}
============================================
  `);
});

export default app;
