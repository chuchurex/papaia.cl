/**
 * Cliente de WhatsApp Cloud API
 * Para enviar mensajes
 */

import { logger } from '../../utils/logger.js';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

/**
 * Envía un mensaje de texto
 * @param {string} to - Número de teléfono destino
 * @param {string} text - Texto del mensaje
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function enviarMensaje(to, text) {
  logger.debug('Enviando mensaje', { to, textLength: text.length });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error enviando mensaje');
    }

    const data = await response.json();
    logger.info('Mensaje enviado', { messageId: data.messages?.[0]?.id });
    return data;

  } catch (error) {
    logger.error('Error enviando mensaje', { error: error.message });
    throw error;
  }
}

/**
 * Envía una imagen
 * @param {string} to - Número destino
 * @param {string} imageUrl - URL de la imagen
 * @param {string} caption - Texto opcional
 */
export async function enviarImagen(to, imageUrl, caption = '') {
  logger.debug('Enviando imagen', { to, imageUrl });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: {
          link: imageUrl,
          caption
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error enviando imagen');
    }

    return await response.json();

  } catch (error) {
    logger.error('Error enviando imagen', { error: error.message });
    throw error;
  }
}

/**
 * Envía botones interactivos
 * @param {string} to - Número destino
 * @param {string} bodyText - Texto del mensaje
 * @param {Array} buttons - Array de botones [{id, title}]
 */
export async function enviarBotones(to, bodyText, buttons) {
  logger.debug('Enviando botones', { to, buttons: buttons.length });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map(b => ({
              type: 'reply',
              reply: { id: b.id, title: b.title }
            }))
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error enviando botones');
    }

    return await response.json();

  } catch (error) {
    logger.error('Error enviando botones', { error: error.message });
    throw error;
  }
}

/**
 * Descarga un archivo multimedia de WhatsApp
 * @param {string} mediaId - ID del archivo
 * @returns {Promise<string>} URL temporal del archivo
 */
export async function descargarMedia(mediaId) {
  logger.debug('Descargando media', { mediaId });

  try {
    // Primero obtener la URL del archivo
    const urlResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
      }
    );

    if (!urlResponse.ok) {
      throw new Error('Error obteniendo URL de media');
    }

    const { url } = await urlResponse.json();

    // Descargar el archivo
    const mediaResponse = await fetch(url, {
      headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
    });

    if (!mediaResponse.ok) {
      throw new Error('Error descargando media');
    }

    // TODO: Subir a Cloud Storage y retornar URL pública
    // Por ahora retornamos la URL temporal
    return url;

  } catch (error) {
    logger.error('Error descargando media', { error: error.message });
    throw error;
  }
}

export const whatsapp = {
  enviarMensaje,
  enviarImagen,
  enviarBotones,
  descargarMedia
};
