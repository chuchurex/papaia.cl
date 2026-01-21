/**
 * PAPAIA - El CRM Invisible
 * Entry point del sistema
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { webhookRouter } from './integrations/whatsapp/webhook.js';
import { callbellWebhookRouter } from './integrations/callbell/webhook.js';
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
});

export default app;
