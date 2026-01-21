/**
 * Prompts para el Orquestador
 * Usa Gemini para generar respuestas contextuales
 */

import { gemini } from '../../integrations/google/gemini.js';

const PROMPTS = {
  inicio: `Eres PAPAIA, un asistente de captación inmobiliaria amigable y eficiente.
Tu rol es ayudar a corredores a captar propiedades de forma fácil.

El corredor acaba de iniciar una nueva captación.
Dale la bienvenida y explica brevemente qué puede hacer:
- Enviar audio describiendo la propiedad
- Enviar fotos
- Compartir ubicación
- Escribir datos directamente

Sé breve, amigable y usa emojis. Habla en español chileno informal pero profesional.`,

  solicitar_informacion: `Eres PAPAIA, asistente de captación inmobiliaria.
El corredor está captando una propiedad. Aquí están los datos que ya tenemos:

{datosActuales}

Y estos son los campos que aún faltan:
{camposFaltantes}

Genera un mensaje breve pidiendo la información faltante de forma amigable.
Da tips si aplica (ej: "puedes enviar un audio describiendo el depa").
Usa español chileno informal pero profesional, con emojis.`,

  captacion_completa: `Eres PAPAIA, asistente de captación inmobiliaria.
El corredor ha completado la captación con estos datos:

{datosCompletos}

Genera un resumen de la propiedad y pregunta si quiere publicar.
Muestra los datos de forma clara y ordenada.
Usa español chileno informal pero profesional.`,

  confirmacion_publicacion: `Eres PAPAIA.
La propiedad ha sido publicada exitosamente en:
{destinos}

Genera un mensaje de confirmación breve y celebratorio.
Incluye los links si están disponibles.`
};

/**
 * Obtiene una respuesta contextual usando Gemini
 * @param {string} tipo - Tipo de respuesta
 * @param {Object} captacion - Estado de la captación
 * @returns {Promise<string>}
 */
export async function obtenerRespuesta(tipo, captacion) {
  let prompt = PROMPTS[tipo];

  if (!prompt) {
    return '¿En qué te puedo ayudar?';
  }

  // Reemplazar variables en el prompt
  prompt = prompt
    .replace('{datosActuales}', JSON.stringify(captacion.datosExtraidos, null, 2))
    .replace('{camposFaltantes}', captacion.camposFaltantes.join(', '))
    .replace('{datosCompletos}', JSON.stringify(captacion.datosExtraidos, null, 2));

  try {
    const respuesta = await gemini.generateText(prompt);
    return respuesta;
  } catch (error) {
    // Fallback responses
    const fallbacks = {
      inicio: '¡Hola! 👋 Soy PAPAIA. Envíame audio, fotos o texto para captar tu propiedad.',
      solicitar_informacion: `📝 Me falta: ${captacion.camposFaltantes.join(', ')}. ¿Me ayudas con eso?`,
      captacion_completa: '✅ ¡Tengo todos los datos! ¿Publicamos la propiedad?',
      confirmacion_publicacion: '🎉 ¡Publicado con éxito!'
    };
    return fallbacks[tipo] || '¿En qué te puedo ayudar?';
  }
}

/**
 * Genera respuesta de bienvenida
 */
export function mensajeBienvenida() {
  return `¡Hola! 👋 Soy PAPAIA, tu asistente de captación.

📸 Mándame fotos de la propiedad
🎙️ Graba un audio describiendo el depa
📍 Comparte la ubicación
✍️ O escríbeme los datos directamente

¡Empecemos! ¿Qué propiedad vamos a captar?`;
}
