/**
 * Cliente de Vision AI (Vertex AI)
 * Para procesamiento y análisis de imágenes
 */

import visionLib from '@google-cloud/vision';
import { logger } from '../../utils/logger.js';

let client = null;

function getClient() {
  if (!client) {
    client = new visionLib.ImageAnnotatorClient();
  }
  return client;
}

/**
 * Clasifica una imagen con etiquetas
 * @param {string} imageUrl - URL de la imagen
 * @param {Object} options - Opciones de clasificación
 * @returns {Promise<Object>} Resultado de clasificación
 */
export async function classify(imageUrl, options = {}) {
  const visionClient = getClient();

  logger.debug('Clasificando imagen', { imageUrl });

  try {
    const [result] = await visionClient.labelDetection(imageUrl);
    const labels = result.labelAnnotations || [];

    // Mapear a categorías personalizadas si se proporcionan
    let topLabel = labels[0]?.description || 'otro';
    let confidence = labels[0]?.score || 0;

    if (options.labels) {
      // Buscar la mejor coincidencia con las etiquetas proporcionadas
      for (const label of labels) {
        const match = options.labels.find(l =>
          label.description.toLowerCase().includes(l.toLowerCase())
        );
        if (match) {
          topLabel = match;
          confidence = label.score;
          break;
        }
      }
    }

    return {
      topLabel,
      confidence: Math.round(confidence * 100),
      allLabels: labels.map(l => ({
        label: l.description,
        confidence: Math.round(l.score * 100)
      }))
    };

  } catch (error) {
    logger.error('Error clasificando imagen', { error: error.message });
    throw error;
  }
}

/**
 * Analiza la calidad de una imagen
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<Object>} Métricas de calidad
 */
export async function analyzeQuality(imageUrl) {
  const visionClient = getClient();

  try {
    const [result] = await visionClient.imageProperties(imageUrl);
    const properties = result.imagePropertiesAnnotation;

    // Análisis básico de calidad basado en propiedades
    const dominantColors = properties?.dominantColors?.colors || [];

    // Heurísticas simples de calidad
    const brillo = calcularBrillo(dominantColors);
    const nitidez = 70; // TODO: Implementar análisis real
    const composicion = 70; // TODO: Implementar análisis real

    return {
      brillo,
      nitidez,
      composicion,
      sugerencias: generarSugerencias({ brillo, nitidez, composicion })
    };

  } catch (error) {
    logger.error('Error analizando calidad', { error: error.message });
    // Retornar valores por defecto
    return { brillo: 70, nitidez: 70, composicion: 70, sugerencias: [] };
  }
}

/**
 * Realiza SafeSearch en una imagen
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<Object>} Resultados de SafeSearch
 */
export async function safeSearch(imageUrl) {
  const visionClient = getClient();

  try {
    const [result] = await visionClient.safeSearchDetection(imageUrl);
    const safe = result.safeSearchAnnotation;

    return {
      adult: safe?.adult || 'UNKNOWN',
      violence: safe?.violence || 'UNKNOWN',
      racy: safe?.racy || 'UNKNOWN',
      medical: safe?.medical || 'UNKNOWN'
    };

  } catch (error) {
    logger.error('Error en SafeSearch', { error: error.message });
    return { adult: 'UNKNOWN', violence: 'UNKNOWN', racy: 'UNKNOWN', medical: 'UNKNOWN' };
  }
}

/**
 * Detecta rostros en una imagen
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<Object[]>} Rostros detectados
 */
export async function detectFaces(imageUrl) {
  const visionClient = getClient();

  try {
    const [result] = await visionClient.faceDetection(imageUrl);
    return result.faceAnnotations || [];

  } catch (error) {
    logger.error('Error detectando rostros', { error: error.message });
    return [];
  }
}

/**
 * Detecta texto en una imagen (OCR)
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<string[]>} Textos detectados
 */
export async function detectText(imageUrl) {
  const visionClient = getClient();

  try {
    const [result] = await visionClient.textDetection(imageUrl);
    const texts = result.textAnnotations || [];
    return texts.map(t => t.description);

  } catch (error) {
    logger.error('Error detectando texto', { error: error.message });
    return [];
  }
}

// Helpers

function calcularBrillo(colors) {
  if (!colors.length) return 50;

  let totalBrillo = 0;
  let totalScore = 0;

  for (const color of colors) {
    const { red = 0, green = 0, blue = 0 } = color.color || {};
    const brillo = (red + green + blue) / 3 / 255 * 100;
    totalBrillo += brillo * (color.score || 1);
    totalScore += color.score || 1;
  }

  return Math.round(totalBrillo / totalScore);
}

function generarSugerencias({ brillo, nitidez, composicion }) {
  const sugerencias = [];

  if (brillo < 40) sugerencias.push('aumentar_brillo');
  if (brillo > 85) sugerencias.push('reducir_brillo');
  if (nitidez < 50) sugerencias.push('aumentar_nitidez');

  return sugerencias;
}

export const vision = {
  classify,
  analyzeQuality,
  safeSearch,
  detectFaces,
  detectText
};
