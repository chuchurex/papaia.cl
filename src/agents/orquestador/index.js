/**
 * 🎯 ORQUESTADOR
 * El cerebro del sistema - coordina el flujo de captación
 */

import { logger } from '../../utils/logger.js';
import { ESTADOS_CAPTACION, actualizarCaptacion, captacionCompleta } from '../../models/captacion.js';
import { transcriptor } from '../transcriptor/index.js';
import { fotografo } from '../fotografo/index.js';
import { publicador } from '../publicador/index.js';
import { obtenerRespuesta } from './prompts.js';

/**
 * Procesa un mensaje entrante de WhatsApp
 * @param {Object} mensaje - Mensaje de WhatsApp
 * @param {Object} captacion - Estado actual de la captación
 * @returns {Promise<{captacion: Object, respuesta: string}>}
 */
export async function procesarMensaje(mensaje, captacion) {
  logger.info('Procesando mensaje', {
    tipo: mensaje.type,
    estado: captacion.estado
  });

  let nuevaCaptacion = captacion;
  let respuesta = '';

  try {
    switch (mensaje.type) {
      case 'audio':
        nuevaCaptacion = await procesarAudio(mensaje, captacion);
        break;

      case 'image':
        nuevaCaptacion = await procesarImagen(mensaje, captacion);
        break;

      case 'text':
        nuevaCaptacion = await procesarTexto(mensaje, captacion);
        break;

      case 'location':
        nuevaCaptacion = await procesarUbicacion(mensaje, captacion);
        break;

      default:
        respuesta = '🤔 No entendí ese tipo de mensaje. Puedes enviarme texto, audio, fotos o ubicación.';
    }

    // Verificar si la captación está completa
    if (captacionCompleta(nuevaCaptacion)) {
      nuevaCaptacion = actualizarCaptacion(
        nuevaCaptacion,
        ESTADOS_CAPTACION.LISTO_PARA_PUBLICAR
      );
      respuesta = await obtenerRespuesta('captacion_completa', nuevaCaptacion);
    } else if (!respuesta) {
      respuesta = await obtenerRespuesta('solicitar_informacion', nuevaCaptacion);
    }

    return { captacion: nuevaCaptacion, respuesta };

  } catch (error) {
    logger.error('Error procesando mensaje', { error: error.message });
    return {
      captacion: actualizarCaptacion(captacion, ESTADOS_CAPTACION.ERROR),
      respuesta: '😅 Hubo un problema procesando tu mensaje. ¿Puedes intentar de nuevo?'
    };
  }
}

/**
 * Procesa un audio de WhatsApp
 */
async function procesarAudio(mensaje, captacion) {
  const nuevaCaptacion = actualizarCaptacion(
    captacion,
    ESTADOS_CAPTACION.PROCESANDO_AUDIO,
    { audiosRecibidos: [...captacion.audiosRecibidos, mensaje.audio.id] }
  );

  // Extraer datos del audio usando el Transcriptor
  const datosExtraidos = await transcriptor.procesarAudio(mensaje.audio);

  return actualizarCaptacion(nuevaCaptacion, ESTADOS_CAPTACION.VALIDANDO, {
    datosExtraidos: { ...nuevaCaptacion.datosExtraidos, ...datosExtraidos },
    camposFaltantes: calcularCamposFaltantes(datosExtraidos)
  });
}

/**
 * Procesa una imagen de WhatsApp
 */
async function procesarImagen(mensaje, captacion) {
  const nuevaCaptacion = actualizarCaptacion(
    captacion,
    ESTADOS_CAPTACION.PROCESANDO_FOTOS,
    { fotosRecibidas: [...captacion.fotosRecibidas, mensaje.image.id] }
  );

  // Procesar foto usando el Estudio Fotográfico
  const fotosProcesadas = await fotografo.procesarFotos([mensaje.image]);

  return actualizarCaptacion(nuevaCaptacion, ESTADOS_CAPTACION.RECIBIENDO_DATOS, {
    fotosProcesadas: [...nuevaCaptacion.fotosProcesadas, ...fotosProcesadas]
  });
}

/**
 * Procesa texto directo
 */
async function procesarTexto(mensaje, captacion) {
  // Extraer datos del texto usando Gemini
  const datosExtraidos = await transcriptor.procesarTexto(mensaje.text.body);

  return actualizarCaptacion(captacion, ESTADOS_CAPTACION.VALIDANDO, {
    datosExtraidos: { ...captacion.datosExtraidos, ...datosExtraidos },
    camposFaltantes: calcularCamposFaltantes({
      ...captacion.datosExtraidos,
      ...datosExtraidos
    })
  });
}

/**
 * Procesa ubicación compartida
 */
async function procesarUbicacion(mensaje, captacion) {
  const { latitude, longitude } = mensaje.location;

  return actualizarCaptacion(captacion, ESTADOS_CAPTACION.RECIBIENDO_DATOS, {
    datosExtraidos: {
      ...captacion.datosExtraidos,
      direccion: {
        ...captacion.datosExtraidos.direccion,
        coordenadas: { lat: latitude, lng: longitude }
      }
    }
  });
}

/**
 * Calcula qué campos faltan
 */
function calcularCamposFaltantes(datos) {
  const obligatorios = ['precio', 'superficie', 'banos', 'direccion'];
  return obligatorios.filter(campo => !datos[campo]);
}

/**
 * Maneja la aprobación del corredor
 */
export async function procesarAprobacion(captacion) {
  const nuevaCaptacion = actualizarCaptacion(
    captacion,
    ESTADOS_CAPTACION.PUBLICANDO
  );

  const resultado = await publicador.publicar(nuevaCaptacion);

  return actualizarCaptacion(nuevaCaptacion, ESTADOS_CAPTACION.COMPLETADO, {
    resultado
  });
}

export const orquestador = {
  procesarMensaje,
  procesarAprobacion
};
