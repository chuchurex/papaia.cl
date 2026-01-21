/**
 * Webhook de WhatsApp Business API
 * Recibe y procesa mensajes de WhatsApp
 */

import { Router } from 'express';
import { logger } from '../../utils/logger.js';
import { orquestador } from '../../agents/orquestador/index.js';
import { mensajeBienvenida } from '../../agents/orquestador/prompts.js';
import { crearCaptacion } from '../../models/captacion.js';
import { enviarMensaje } from './client.js';

export const webhookRouter = Router();

// Store de captaciones en memoria (TODO: mover a Firestore)
const captaciones = new Map();

/**
 * Verificación del webhook (requerido por Meta)
 */
webhookRouter.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('Webhook verificado');
    res.status(200).send(challenge);
  } else {
    logger.warn('Verificación de webhook fallida');
    res.sendStatus(403);
  }
});

/**
 * Recibe mensajes de WhatsApp
 */
webhookRouter.post('/', async (req, res) => {
  try {
    const body = req.body;

    // Verificar que es un mensaje de WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      return res.sendStatus(404);
    }

    // Responder inmediatamente (requisito de Meta)
    res.sendStatus(200);

    // Procesar cada entrada
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          await procesarCambio(change.value);
        }
      }
    }

  } catch (error) {
    logger.error('Error en webhook', { error: error.message });
    res.sendStatus(500);
  }
});

/**
 * Procesa un cambio (mensaje) de WhatsApp
 */
async function procesarCambio(value) {
  const messages = value.messages || [];
  const contacts = value.contacts || [];

  for (const message of messages) {
    const telefono = message.from;
    const contacto = contacts.find(c => c.wa_id === telefono);
    const nombre = contacto?.profile?.name || 'Usuario';

    logger.info('Mensaje recibido', {
      telefono,
      nombre,
      tipo: message.type
    });

    // Obtener o crear captación
    let captacion = captaciones.get(telefono);

    if (!captacion) {
      // Nueva conversación
      captacion = crearCaptacion(telefono, telefono);
      captaciones.set(telefono, captacion);

      // Enviar bienvenida
      await enviarMensaje(telefono, mensajeBienvenida());
      return;
    }

    // Procesar mensaje con el orquestador
    const resultado = await orquestador.procesarMensaje(message, captacion);

    // Actualizar captación
    captaciones.set(telefono, resultado.captacion);

    // Enviar respuesta
    if (resultado.respuesta) {
      await enviarMensaje(telefono, resultado.respuesta);
    }
  }
}

/**
 * Limpia captaciones expiradas
 */
function limpiarExpiradas() {
  const ahora = new Date();

  for (const [telefono, captacion] of captaciones.entries()) {
    if (captacion.expiresAt && captacion.expiresAt < ahora) {
      captaciones.delete(telefono);
      logger.debug('Captación expirada eliminada', { telefono });
    }
  }
}

// Limpiar cada hora
setInterval(limpiarExpiradas, 60 * 60 * 1000);
