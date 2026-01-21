/**
 * PAPAIA - El CRM Invisible
 * Entry point del sistema
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { webhookRouter } from './integrations/whatsapp/webhook.js';
import { callbellWebhookRouter, getCaptaciones } from './integrations/callbell/webhook.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files (Dashboard)
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/webhook', webhookRouter);           // Legacy Meta API
app.use('/webhook/callbell', callbellWebhookRouter);  // Callbell API

// ============ API para Dashboard ============

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
  logger.info(`📱 Webhook disponible en /webhook`);
  logger.info(`📊 API disponible en /api`);
});

export default app;

