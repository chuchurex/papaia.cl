/**
 * 📢 PUBLICADOR
 * Genera publicaciones y las distribuye a CRMs
 */

import { logger } from '../../utils/logger.js';
import { gemini } from '../../integrations/google/gemini.js';
import { maps } from '../../integrations/google/maps.js';
import { crearPropiedad } from '../../models/propiedad.js';

const PROMPT_PUBLICACION = `Eres un experto copywriter inmobiliario en Chile.
Genera una publicación profesional y atractiva para la siguiente propiedad.

Datos de la propiedad:
{datos}

USPs del barrio (de Google Maps):
{usps}

Genera un JSON con:
{
  "titulo": "Título atractivo de máximo 80 caracteres",
  "descripcion": "Descripción de 3-4 párrafos, profesional pero cálida. Destaca los puntos fuertes.",
  "hashtags": ["array de 5 hashtags relevantes"]
}

Usa español chileno profesional. No inventes datos que no estén en la información proporcionada.`;

/**
 * Publica una captación en los CRMs configurados
 * @param {Object} captacion - Estado de la captación
 * @returns {Promise<Object>} Resultado de la publicación
 */
export async function publicar(captacion) {
  logger.info('Iniciando publicación', { captacionId: captacion.id });

  try {
    // 1. Obtener USPs del barrio
    const usps = await obtenerUSPs(captacion.datosExtraidos.direccion);

    // 2. Generar contenido de la publicación
    const contenido = await generarContenido(captacion.datosExtraidos, usps);

    // 3. Crear propiedad estructurada
    const propiedad = crearPropiedad({
      ...captacion.datosExtraidos,
      descripcion: contenido.descripcion,
      fotos: captacion.fotosProcesadas.map(f => f.urlMejorada || f.urlOriginal),
      usps: usps
    });

    // 4. Publicar en cada CRM configurado
    const resultados = await publicarEnCRMs(propiedad, contenido);

    logger.info('Publicación completada', {
      propiedadId: propiedad.id,
      destinos: resultados.map(r => r.crm)
    });

    return {
      propiedad,
      contenido,
      publicaciones: resultados
    };

  } catch (error) {
    logger.error('Error en publicación', { error: error.message });
    throw error;
  }
}

/**
 * Obtiene USPs del barrio usando Google Maps
 */
async function obtenerUSPs(direccion) {
  if (!direccion?.coordenadas) {
    return [];
  }

  try {
    const lugares = await maps.nearbySearch({
      location: direccion.coordenadas,
      radius: 500 // 500 metros
    });

    // Categorizar y seleccionar los más relevantes
    const usps = [];

    const categorias = {
      metro: ['subway_station', 'transit_station'],
      educacion: ['school', 'university'],
      salud: ['hospital', 'pharmacy'],
      comercio: ['supermarket', 'shopping_mall'],
      parques: ['park']
    };

    for (const [categoria, tipos] of Object.entries(categorias)) {
      const lugar = lugares.find(l =>
        l.types.some(t => tipos.includes(t))
      );

      if (lugar) {
        const distancia = calcularDistancia(
          direccion.coordenadas,
          lugar.geometry.location
        );
        usps.push(`A ${distancia}m de ${lugar.name}`);
      }
    }

    return usps;

  } catch (error) {
    logger.warn('No se pudieron obtener USPs', { error: error.message });
    return [];
  }
}

/**
 * Genera contenido de publicación con Gemini
 */
async function generarContenido(datos, usps) {
  const prompt = PROMPT_PUBLICACION
    .replace('{datos}', JSON.stringify(datos, null, 2))
    .replace('{usps}', usps.join('\n'));

  try {
    const resultado = await gemini.generateText(prompt, {
      temperature: 0.7
    });

    const jsonLimpio = resultado
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(jsonLimpio);

  } catch (error) {
    // Fallback a contenido básico
    return {
      titulo: generarTituloBasico(datos),
      descripcion: generarDescripcionBasica(datos),
      hashtags: ['#propiedades', '#inmobiliaria', '#chile']
    };
  }
}

/**
 * Publica en los CRMs configurados
 */
async function publicarEnCRMs(propiedad, contenido) {
  // TODO: Implementar adaptadores reales
  // Por ahora simulamos

  const crms = ['prop360']; // CRMs habilitados
  const resultados = [];

  for (const crm of crms) {
    try {
      // const adaptador = require(`../../integrations/crm/${crm}.js`);
      // const resultado = await adaptador.publicar(propiedad, contenido);

      // Simulación
      resultados.push({
        crm,
        success: true,
        id: `${crm}-${Date.now()}`,
        url: `https://${crm}.cl/propiedad/123`
      });

    } catch (error) {
      resultados.push({
        crm,
        success: false,
        error: error.message
      });
    }
  }

  return resultados;
}

// Helpers

function calcularDistancia(coord1, coord2) {
  // Fórmula Haversine simplificada
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(coord1.lat * Math.PI / 180) *
    Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function generarTituloBasico(datos) {
  const tipo = datos.tipo || 'Propiedad';
  const comuna = datos.direccion?.comuna || '';
  const m2 = datos.superficie?.total || '';
  return `${tipo} en ${comuna}${m2 ? ` | ${m2}m²` : ''}`;
}

function generarDescripcionBasica(datos) {
  const partes = [];

  if (datos.dormitorios) partes.push(`${datos.dormitorios} dormitorios`);
  if (datos.banos) partes.push(`${datos.banos} baños`);
  if (datos.superficie?.total) partes.push(`${datos.superficie.total}m² totales`);
  if (datos.estacionamientos) partes.push(`${datos.estacionamientos} estacionamientos`);

  return `Excelente propiedad con ${partes.join(', ')}.`;
}

export const publicador = {
  publicar,
  generarContenido
};
