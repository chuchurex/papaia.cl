/**
 * Webhook de Callbell
 * Recibe eventos de WhatsApp vía Callbell
 */

import { Router } from 'express';
import { logger } from '../../utils/logger.js';
import { orquestador } from '../../agents/orquestador/index.js';
import { mensajeBienvenida } from '../../agents/orquestador/prompts.js';
import { crearCaptacion } from '../../models/captacion.js';
import { enviarMensaje } from './client.js';

export const callbellWebhookRouter = Router();

// Store de captaciones en memoria (TODO: mover a Firestore)
const captaciones = new Map();

/**
 * Recibe eventos de Callbell
 * Documentación: https://docs.callbell.eu/webhooks/introduction
 */
callbellWebhookRouter.post('/', async (req, res) => {
  try {
    const event = req.body;

    logger.debug('Evento Callbell recibido', {
      type: event.type,
      payload: event.payload
    });

    // Responder inmediatamente
    res.status(200).json({ status: 'ok' });

    // Procesar según tipo de evento
    switch (event.type) {
      case 'message_created':
        await procesarMensajeEntrante(event.payload);
        break;

      case 'message_status_updated':
        logger.debug('Estado de mensaje actualizado', event.payload);
        break;

      default:
        logger.debug('Evento no manejado', { type: event.type });
    }

  } catch (error) {
    logger.error('Error en webhook Callbell', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * Procesa un mensaje entrante
 */
async function procesarMensajeEntrante(payload) {
  const { message, contact } = payload;

  // Solo procesar mensajes entrantes (no los enviados por nosotros)
  if (message.direction !== 'in') {
    return;
  }

  const telefono = contact.phone;
  const nombre = contact.name || 'Usuario';

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

  // Convertir mensaje de Callbell a formato interno
  const mensajeInterno = convertirMensaje(message);

  // Procesar mensaje con el orquestador
  const resultado = await orquestador.procesarMensaje(mensajeInterno, captacion);

  // Actualizar captación
  captaciones.set(telefono, resultado.captacion);

  // Enviar respuesta
  if (resultado.respuesta) {
    await enviarMensaje(telefono, resultado.respuesta);
  }
}

/**
 * Convierte un mensaje de Callbell al formato interno
 */
function convertirMensaje(message) {
  const base = {
    id: message.uuid,
    timestamp: message.createdAt
  };

  switch (message.type) {
    case 'text':
      return {
        ...base,
        type: 'text',
        text: { body: message.text }
      };

    case 'image':
      return {
        ...base,
        type: 'image',
        image: {
          id: message.uuid,
          url: message.mediaUrl
        }
      };

    case 'audio':
    case 'voice':
      return {
        ...base,
        type: 'audio',
        audio: {
          id: message.uuid,
          url: message.mediaUrl
        }
      };

    case 'location':
      return {
        ...base,
        type: 'location',
        location: {
          latitude: message.latitude,
          longitude: message.longitude
        }
      };

    default:
      return {
        ...base,
        type: message.type
      };
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

/**
 * Obtiene todas las captaciones (para API)
 * @returns {Array} Array de captaciones
 */
export function getCaptaciones() {
  return Array.from(captaciones.values());
}

