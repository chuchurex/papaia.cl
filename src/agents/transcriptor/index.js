/**
 * 🎙️ TRANSCRIPTOR
 * Procesa audio y texto para extraer datos estructurados
 */

import { logger } from '../../utils/logger.js';
import { gemini } from '../../integrations/google/gemini.js';
import { validarCaptacion } from '../../utils/validators.js';

const PROMPT_EXTRACCION = `Eres un experto en extracción de datos inmobiliarios de Chile.
Analiza el siguiente texto (transcripción de audio o mensaje directo) y extrae la información de la propiedad.

REGLAS CRÍTICAS:
1. NO alucines datos. Si algo no se menciona, déjalo null.
2. Precio, m² y baños son SAGRADOS - solo extráelos si se mencionan explícitamente.
3. Interpreta jerga chilena: "depa" = departamento, "estaciona" = estacionamiento, etc.
4. Para precios: "150 palos" = 150.000.000 CLP, "2.500 UF" = 2500 UF

Texto a analizar:
---
{texto}
---

Responde SOLO con un JSON válido con esta estructura:
{
  "tipo": "departamento|casa|oficina|terreno|local|null",
  "operacion": "venta|arriendo|null",
  "precio": { "valor": number|null, "moneda": "CLP|UF|USD" },
  "superficie": { "total": number|null, "util": number|null },
  "dormitorios": number|null,
  "banos": number|null,
  "estacionamientos": number|null,
  "bodega": boolean|null,
  "direccion": {
    "calle": "string|null",
    "numero": "string|null", 
    "comuna": "string|null"
  },
  "descripcion_raw": "resumen breve de lo mencionado",
  "usps_detectados": ["array de puntos destacados mencionados"]
}`;

/**
 * Procesa audio de WhatsApp y extrae datos
 * @param {Object} audio - Objeto de audio de WhatsApp
 * @returns {Promise<Object>} Datos extraídos
 */
export async function procesarAudio(audio) {
  logger.info('Procesando audio (MOCK)', { audioId: audio.id });

  // MVP: Retornar datos mock mientras no tengamos Google Cloud
  // TODO: Descomentar cuando se configure Gemini
  /*
  try {
    const resultado = await gemini.processAudio(audio.url, PROMPT_EXTRACCION);
    const datosExtraidos = JSON.parse(resultado);
    const validacion = validarCaptacion(datosExtraidos);
    if (!validacion.valido) {
      logger.warn('Datos extraídos con problemas', validacion);
    }
    return datosExtraidos;
  } catch (error) {
    logger.error('Error procesando audio', { error: error.message });
    throw error;
  }
  */

  // MOCK: Datos de prueba
  return {
    tipo: null,
    operacion: null,
    precio: { valor: null, moneda: 'CLP' },
    superficie: { total: null, util: null },
    dormitorios: null,
    banos: null,
    estacionamientos: null,
    bodega: null,
    direccion: { calle: null, numero: null, comuna: null },
    descripcion_raw: 'Audio recibido - pendiente procesamiento',
    usps_detectados: []
  };
}

/**
 * Procesa texto directo y extrae datos
 * @param {string} texto - Texto del mensaje
 * @returns {Promise<Object>} Datos extraídos
 */
export async function procesarTexto(texto) {
  logger.info('Procesando texto (MOCK)', { longitud: texto.length });

  // MVP: Extracción básica con regex mientras no tengamos Gemini
  const datos = {
    tipo: null,
    operacion: null,
    precio: { valor: null, moneda: 'CLP' },
    superficie: { total: null, util: null },
    dormitorios: null,
    banos: null,
    estacionamientos: null,
    bodega: null,
    direccion: { calle: null, numero: null, comuna: null },
    descripcion_raw: texto.slice(0, 200),
    usps_detectados: []
  };

  // Extracción básica con regex
  const precioMatch = texto.match(/(\d{1,3}(?:\.\d{3})*(?:\.\d{3})?|\d+)\s*(uf|UF|millones?|palos?)?/i);
  if (precioMatch) {
    let valor = parseInt(precioMatch[1].replace(/\./g, ''));
    if (/palo|millon/i.test(precioMatch[2] || '')) valor *= 1000000;
    datos.precio.valor = valor;
    datos.precio.moneda = /uf/i.test(precioMatch[2] || '') ? 'UF' : 'CLP';
  }

  const m2Match = texto.match(/(\d+)\s*(?:m2|metros?|mts?)/i);
  if (m2Match) datos.superficie.total = parseInt(m2Match[1]);

  const dormMatch = texto.match(/(\d+)\s*(?:dorm|dormitorio|pieza|habitacion)/i);
  if (dormMatch) datos.dormitorios = parseInt(dormMatch[1]);

  const banoMatch = texto.match(/(\d+)\s*(?:baño|bano)/i);
  if (banoMatch) datos.banos = parseInt(banoMatch[1]);

  if (/depa|departamento/i.test(texto)) datos.tipo = 'departamento';
  if (/casa/i.test(texto)) datos.tipo = 'casa';
  if (/venta|vendo/i.test(texto)) datos.operacion = 'venta';
  if (/arriendo|arriendo/i.test(texto)) datos.operacion = 'arriendo';

  logger.debug('Datos extraídos (MOCK)', datos);
  return datos;
}

/**
 * Combina datos de múltiples fuentes
 * @param {Object} datosExistentes - Datos ya extraídos
 * @param {Object} datosNuevos - Nuevos datos a combinar
 * @returns {Object} Datos combinados
 */
export function combinarDatos(datosExistentes, datosNuevos) {
  const combinados = { ...datosExistentes };

  for (const [key, value] of Object.entries(datosNuevos)) {
    // Solo sobrescribir si el nuevo valor no es null
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Merge recursivo para objetos
        combinados[key] = combinarDatos(combinados[key] || {}, value);
      } else {
        combinados[key] = value;
      }
    }
  }

  return combinados;
}

export const transcriptor = {
  procesarAudio,
  procesarTexto,
  combinarDatos
};
