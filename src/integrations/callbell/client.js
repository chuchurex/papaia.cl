/**
 * Cliente de Callbell API
 * Para enviar mensajes vía WhatsApp
 */

import { logger } from '../../utils/logger.js';

const CALLBELL_API_KEY = process.env.CALLBELL_API_KEY;
const API_URL = 'https://api.callbell.eu/v1';

/**
 * Envía un mensaje de texto vía WhatsApp
 * @param {string} to - Número de teléfono destino (formato internacional)
 * @param {string} text - Texto del mensaje
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function enviarMensaje(to, text) {
  logger.debug('Enviando mensaje via Callbell', { to, textLength: text.length });

  try {
    const response = await fetch(`${API_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALLBELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        from: 'whatsapp',
        type: 'text',
        content: { text }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error enviando mensaje');
    }

    const data = await response.json();
    logger.info('Mensaje enviado via Callbell', { uuid: data.message?.uuid });
    return data;

  } catch (error) {
    logger.error('Error enviando mensaje Callbell', { error: error.message });
    throw error;
  }
}

/**
 * Envía una imagen vía WhatsApp
 * @param {string} to - Número destino
 * @param {string} imageUrl - URL de la imagen
 * @param {string} caption - Texto opcional
 */
export async function enviarImagen(to, imageUrl, caption = '') {
  logger.debug('Enviando imagen via Callbell', { to, imageUrl });

  try {
    const response = await fetch(`${API_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALLBELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        from: 'whatsapp',
        type: 'image',
        content: {
          url: imageUrl,
          caption
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error enviando imagen');
    }

    return await response.json();

  } catch (error) {
    logger.error('Error enviando imagen Callbell', { error: error.message });
    throw error;
  }
}

/**
 * Envía un documento vía WhatsApp
 * @param {string} to - Número destino
 * @param {string} documentUrl - URL del documento
 * @param {string} filename - Nombre del archivo
 */
export async function enviarDocumento(to, documentUrl, filename) {
  logger.debug('Enviando documento via Callbell', { to, documentUrl });

  try {
    const response = await fetch(`${API_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALLBELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        from: 'whatsapp',
        type: 'document',
        content: {
          url: documentUrl,
          filename
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error enviando documento');
    }

    return await response.json();

  } catch (error) {
    logger.error('Error enviando documento Callbell', { error: error.message });
    throw error;
  }
}

/**
 * Obtiene información de un contacto
 * @param {string} phone - Número de teléfono
 * @returns {Promise<Object|null>} Información del contacto
 */
export async function obtenerContacto(phone) {
  try {
    const response = await fetch(`${API_URL}/contacts/${phone}`, {
      headers: {
        'Authorization': `Bearer ${CALLBELL_API_KEY}`
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();

  } catch (error) {
    logger.error('Error obteniendo contacto', { error: error.message });
    return null;
  }
}

export const callbell = {
  enviarMensaje,
  enviarImagen,
  enviarDocumento,
  obtenerContacto
};
