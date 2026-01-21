/**
 * Adaptador base para CRMs inmobiliarios
 * Define la interfaz que deben implementar los adaptadores específicos
 */

import { logger } from '../../utils/logger.js';

/**
 * Clase base para adaptadores de CRM
 * @abstract
 */
export class CRMAdapter {
  constructor(config = {}) {
    this.config = config;
    this.nombre = 'base';
  }

  /**
   * Publica una propiedad en el CRM
   * @abstract
   * @param {Object} propiedad - Propiedad a publicar
   * @param {Object} contenido - Contenido generado (título, descripción)
   * @returns {Promise<Object>} Resultado de la publicación
   */
  async publicar(propiedad, contenido) {
    throw new Error('Método publicar() debe ser implementado');
  }

  /**
   * Actualiza una propiedad existente
   * @abstract
   * @param {string} id - ID de la propiedad en el CRM
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async actualizar(id, datos) {
    throw new Error('Método actualizar() debe ser implementado');
  }

  /**
   * Pausa/despublica una propiedad
   * @abstract
   * @param {string} id - ID de la propiedad en el CRM
   * @returns {Promise<boolean>} true si exitoso
   */
  async pausar(id) {
    throw new Error('Método pausar() debe ser implementado');
  }

  /**
   * Elimina una propiedad del CRM
   * @abstract
   * @param {string} id - ID de la propiedad en el CRM
   * @returns {Promise<boolean>} true si exitoso
   */
  async eliminar(id) {
    throw new Error('Método eliminar() debe ser implementado');
  }

  /**
   * Verifica la conexión con el CRM
   * @returns {Promise<boolean>} true si conectado
   */
  async verificarConexion() {
    logger.warn(`verificarConexion() no implementado para ${this.nombre}`);
    return false;
  }

  /**
   * Transforma los datos de propiedad al formato del CRM
   * @param {Object} propiedad - Propiedad en formato PAPAIA
   * @returns {Object} Propiedad en formato del CRM
   */
  transformar(propiedad) {
    // Por defecto retorna sin transformar
    return propiedad;
  }
}

/**
 * Registro de adaptadores disponibles
 */
export const adaptadores = new Map();

/**
 * Registra un adaptador
 * @param {string} nombre - Nombre del CRM
 * @param {CRMAdapter} adaptador - Instancia del adaptador
 */
export function registrarAdaptador(nombre, adaptador) {
  adaptadores.set(nombre, adaptador);
  logger.info(`Adaptador ${nombre} registrado`);
}

/**
 * Obtiene un adaptador por nombre
 * @param {string} nombre - Nombre del CRM
 * @returns {CRMAdapter|null}
 */
export function obtenerAdaptador(nombre) {
  return adaptadores.get(nombre) || null;
}

/**
 * Publica en múltiples CRMs
 * @param {Object} propiedad - Propiedad a publicar
 * @param {Object} contenido - Contenido generado
 * @param {string[]} crms - Lista de CRMs donde publicar
 * @returns {Promise<Object[]>} Resultados por CRM
 */
export async function publicarEnMultiples(propiedad, contenido, crms) {
  const resultados = [];

  for (const crmNombre of crms) {
    const adaptador = obtenerAdaptador(crmNombre);

    if (!adaptador) {
      resultados.push({
        crm: crmNombre,
        success: false,
        error: `Adaptador ${crmNombre} no encontrado`
      });
      continue;
    }

    try {
      const resultado = await adaptador.publicar(propiedad, contenido);
      resultados.push({
        crm: crmNombre,
        success: true,
        ...resultado
      });
    } catch (error) {
      resultados.push({
        crm: crmNombre,
        success: false,
        error: error.message
      });
    }
  }

  return resultados;
}
