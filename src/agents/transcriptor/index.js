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
  logger.info('Procesando audio', { audioId: audio.id });

  try {
    // Gemini 1.5 Pro puede procesar audio directamente (multimodal)
    const resultado = await gemini.processAudio(audio.url, PROMPT_EXTRACCION);

    const datosExtraidos = JSON.parse(resultado);

    // Validar datos críticos
    const validacion = validarCaptacion(datosExtraidos);
    if (!validacion.valido) {
      logger.warn('Datos extraídos con problemas', {
        errores: validacion.errores,
        warnings: validacion.warnings
      });
    }

    return datosExtraidos;

  } catch (error) {
    logger.error('Error procesando audio', { error: error.message });
    throw error;
  }
}

/**
 * Procesa texto directo y extrae datos
 * @param {string} texto - Texto del mensaje
 * @returns {Promise<Object>} Datos extraídos
 */
export async function procesarTexto(texto) {
  logger.info('Procesando texto', { longitud: texto.length });

  try {
    const prompt = PROMPT_EXTRACCION.replace('{texto}', texto);
    const resultado = await gemini.generateText(prompt, {
      temperature: 0.1, // Bajo para extracción precisa
      maxTokens: 1000
    });

    // Limpiar respuesta (a veces viene con markdown)
    const jsonLimpio = resultado
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const datosExtraidos = JSON.parse(jsonLimpio);

    // Validar
    const validacion = validarCaptacion(datosExtraidos);
    logger.debug('Validación de extracción', validacion);

    return datosExtraidos;

  } catch (error) {
    logger.error('Error procesando texto', { error: error.message });
    throw error;
  }
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
