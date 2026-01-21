/**
 * Cliente de Gemini (Vertex AI)
 * Interfaz para interactuar con Gemini 1.5 Pro
 */

import aiplatform from '@google-cloud/aiplatform';
const { VertexAI } = aiplatform;
import { logger } from '../../utils/logger.js';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = 'us-central1';
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

let vertexAI = null;

/**
 * Inicializa cliente de Vertex AI
 */
function getClient() {
  if (!vertexAI) {
    vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION
    });
  }
  return vertexAI;
}

/**
 * Genera texto con Gemini
 * @param {string} prompt - Prompt de texto
 * @param {Object} options - Opciones de generación
 * @returns {Promise<string>} Texto generado
 */
export async function generateText(prompt, options = {}) {
  const client = getClient();
  const model = client.preview.getGenerativeModel({ model: MODEL });

  const generationConfig = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxTokens ?? 2048,
    topP: options.topP ?? 0.95
  };

  logger.debug('Generando texto con Gemini', {
    model: MODEL,
    promptLength: prompt.length
  });

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig
    });

    const response = result.response;
    const text = response.candidates[0].content.parts[0].text;

    logger.debug('Texto generado', { responseLength: text.length });
    return text;

  } catch (error) {
    logger.error('Error en Gemini', { error: error.message });
    throw error;
  }
}

/**
 * Procesa audio con Gemini (multimodal)
 * @param {string} audioUrl - URL del audio
 * @param {string} prompt - Instrucciones de procesamiento
 * @returns {Promise<string>} Resultado del procesamiento
 */
export async function processAudio(audioUrl, prompt) {
  const client = getClient();
  const model = client.preview.getGenerativeModel({ model: MODEL });

  logger.debug('Procesando audio con Gemini', { audioUrl });

  try {
    // Gemini 1.5 Pro soporta audio nativo
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: 'audio/ogg',
              fileUri: audioUrl
            }
          },
          { text: prompt }
        ]
      }]
    });

    const response = result.response;
    return response.candidates[0].content.parts[0].text;

  } catch (error) {
    logger.error('Error procesando audio', { error: error.message });
    throw error;
  }
}

/**
 * Procesa imagen con Gemini (multimodal)
 * @param {string} imageUrl - URL de la imagen
 * @param {string} prompt - Instrucciones de análisis
 * @returns {Promise<string>} Resultado del análisis
 */
export async function processImage(imageUrl, prompt) {
  const client = getClient();
  const model = client.preview.getGenerativeModel({ model: MODEL });

  logger.debug('Procesando imagen con Gemini', { imageUrl });

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: 'image/jpeg',
              fileUri: imageUrl
            }
          },
          { text: prompt }
        ]
      }]
    });

    const response = result.response;
    return response.candidates[0].content.parts[0].text;

  } catch (error) {
    logger.error('Error procesando imagen', { error: error.message });
    throw error;
  }
}

export const gemini = {
  generateText,
  processAudio,
  processImage
};
