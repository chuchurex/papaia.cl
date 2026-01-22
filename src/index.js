/**
 * PAPAIA - El CRM Invisible
 * Entry point del sistema
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initBaileys, getQRCode, getCaptaciones } from './integrations/baileys/client.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files (Dashboard)
app.use(express.static(path.join(__dirname, '../public')));

// Initialize WhatsApp (Baileys)
initBaileys().catch(err => logger.error('Failed to init Baileys', err));

// ============ API para Dashboard ============

// Obtener QR para autenticación
app.get('/api/qr', (req, res) => {
  const qr = getQRCode();
  res.json({ success: true, qr, connected: !qr });
});

// Obtener todas las captaciones
app.get('/api/captaciones', (req, res) => {
  const captaciones = getCaptaciones();
  res.json({
    success: true,
    data: captaciones,
    total: captaciones.length
  });
});

// Obtener estadísticas
app.get('/api/stats', (req, res) => {
  const captaciones = getCaptaciones();
  const stats = {
    total: captaciones.length,
    porEstado: {},
    ultimaActividad: null
  };

  captaciones.forEach(c => {
    stats.porEstado[c.estado] = (stats.porEstado[c.estado] || 0) + 1;
    if (!stats.ultimaActividad || c.updatedAt > stats.ultimaActividad) {
      stats.ultimaActividad = c.updatedAt;
    }
  });

  res.json({ success: true, data: stats });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'papaia',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🍈 PAPAIA corriendo en puerto ${PORT}`);
  logger.info(`📱 Baileys iniciado`);
  logger.info(`📊 API disponible en /api`);
});

export default app;

