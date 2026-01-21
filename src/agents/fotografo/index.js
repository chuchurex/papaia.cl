/**
 * 📸 ESTUDIO FOTOGRÁFICO
 * Selecciona y mejora fotos con criterio estético y ético
 */

import { logger } from '../../utils/logger.js';
import { vision } from '../../integrations/google/vision.js';

/**
 * Categorías de fotos inmobiliarias
 */
const CATEGORIAS = {
  FACHADA: 'fachada',
  LIVING: 'living',
  COCINA: 'cocina',
  DORMITORIO: 'dormitorio',
  BANO: 'bano',
  TERRAZA: 'terraza',
  VISTA: 'vista',
  PLANO: 'plano',
  OTRO: 'otro'
};

/**
 * Procesa un lote de fotos
 * @param {Object[]} fotos - Array de fotos de WhatsApp
 * @returns {Promise<Object[]>} Fotos procesadas con metadata
 */
export async function procesarFotos(fotos) {
  logger.info('Procesando fotos', { cantidad: fotos.length });

  const resultados = await Promise.all(
    fotos.map(foto => procesarFoto(foto))
  );

  // Filtrar fotos rechazadas
  const fotosValidas = resultados.filter(r => r.valida);

  // Ordenar por score
  fotosValidas.sort((a, b) => b.score - a.score);

  // Seleccionar las mejores por categoría
  const seleccion = seleccionarMejores(fotosValidas);

  logger.info('Fotos procesadas', {
    total: fotos.length,
    validas: fotosValidas.length,
    seleccionadas: seleccion.length
  });

  return seleccion;
}

/**
 * Procesa una foto individual
 * @param {Object} foto - Foto de WhatsApp
 * @returns {Promise<Object>} Resultado del procesamiento
 */
async function procesarFoto(foto) {
  // MVP: Mock sin Vision API
  logger.info('Procesando foto (MOCK)', { fotoId: foto.id });

  // Retornar datos mock - todas las fotos son válidas por ahora
  return {
    id: foto.id,
    urlOriginal: foto.url,
    urlMejorada: foto.url,
    categoria: CATEGORIAS.OTRO,
    score: 75,
    metadata: {
      clasificacion: { categoria: CATEGORIAS.OTRO, confianza: 0.8 },
      calidad: { score: 75, brillo: 80, nitidez: 70, composicion: 75 }
    },
    valida: true
  };

  /* TODO: Descomentar cuando se configure Google Vision
  try {
    const clasificacion = await clasificarFoto(foto);
    const calidad = await evaluarCalidad(foto);
    const etica = await verificarEtica(foto);

    if (!etica.valida) {
      logger.warn('Foto rechazada por contenido', { fotoId: foto.id, razon: etica.razon });
      return { ...foto, valida: false, razon: etica.razon };
    }

    let urlMejorada = foto.url;
    if (calidad.requiereMejora) {
      urlMejorada = await mejorarFoto(foto, calidad.mejoras);
    }

    return {
      id: foto.id,
      urlOriginal: foto.url,
      urlMejorada,
      categoria: clasificacion.categoria,
      score: calcularScore(clasificacion, calidad),
      metadata: { clasificacion, calidad },
      valida: true
    };
  } catch (error) {
    logger.error('Error procesando foto', { fotoId: foto.id, error: error.message });
    return { ...foto, valida: false, razon: 'Error de procesamiento' };
  }
  */
}

/**
 * Clasifica qué muestra la foto
 */
async function clasificarFoto(foto) {
  const resultado = await vision.classify(foto.url, {
    labels: Object.values(CATEGORIAS)
  });

  return {
    categoria: resultado.topLabel || CATEGORIAS.OTRO,
    confianza: resultado.confidence || 0
  };
}

/**
 * Evalúa la calidad técnica de la foto
 */
async function evaluarCalidad(foto) {
  const analisis = await vision.analyzeQuality(foto.url);

  const score = (
    analisis.brillo * 0.3 +
    analisis.nitidez * 0.4 +
    analisis.composicion * 0.3
  );

  return {
    score,
    brillo: analisis.brillo,
    nitidez: analisis.nitidez,
    composicion: analisis.composicion,
    requiereMejora: score < 70,
    mejoras: analisis.sugerencias || []
  };
}

/**
 * Verifica que el contenido sea ético
 */
async function verificarEtica(foto) {
  const safeSearch = await vision.safeSearch(foto.url);

  // Rechazar si tiene contenido inapropiado
  if (safeSearch.adult === 'LIKELY' || safeSearch.violence === 'LIKELY') {
    return { valida: false, razon: 'Contenido inapropiado' };
  }

  // Advertir si hay personas identificables
  const rostros = await vision.detectFaces(foto.url);
  if (rostros.length > 0) {
    logger.warn('Foto contiene rostros', { fotoId: foto.id, cantidad: rostros.length });
    // Por ahora solo advertimos, no rechazamos
  }

  // Detectar datos sensibles (patentes, documentos)
  const textos = await vision.detectText(foto.url);
  const patronesSensibles = [
    /[A-Z]{2,4}[\s-]?\d{2,4}/i, // Patentes
    /\d{2}\.\d{3}\.\d{3}-[0-9Kk]/  // RUT
  ];

  for (const texto of textos) {
    for (const patron of patronesSensibles) {
      if (patron.test(texto)) {
        return { valida: false, razon: 'Contiene datos sensibles' };
      }
    }
  }

  return { valida: true };
}

/**
 * Aplica mejoras automáticas a la foto
 */
async function mejorarFoto(foto, mejoras) {
  // TODO: Implementar con Vertex AI Vision
  // Por ahora retornamos la URL original
  logger.debug('Aplicando mejoras', { fotoId: foto.id, mejoras });
  return foto.url;
}

/**
 * Calcula score total de la foto
 */
function calcularScore(clasificacion, calidad) {
  const pesoCategoria = clasificacion.categoria !== CATEGORIAS.OTRO ? 1.2 : 1.0;
  return (clasificacion.confianza * 40 + calidad.score * 60) * pesoCategoria;
}

/**
 * Selecciona las mejores fotos por categoría
 */
function seleccionarMejores(fotos, maxPorCategoria = 2, maxTotal = 10) {
  const porCategoria = {};
  const seleccionadas = [];

  for (const foto of fotos) {
    const cat = foto.categoria;
    porCategoria[cat] = porCategoria[cat] || [];

    if (porCategoria[cat].length < maxPorCategoria) {
      porCategoria[cat].push(foto);
      seleccionadas.push(foto);

      if (seleccionadas.length >= maxTotal) break;
    }
  }

  return seleccionadas;
}

export const fotografo = {
  procesarFotos,
  CATEGORIAS
};
