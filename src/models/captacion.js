/**
 * Modelo de Estado de Captación
 * Mantiene el estado de una conversación de captación en curso
 */

/**
 * Estados posibles del flujo de captación
 */
export const ESTADOS_CAPTACION = {
  INICIO: 'inicio',
  RECIBIENDO_DATOS: 'recibiendo_datos',
  PROCESANDO_AUDIO: 'procesando_audio',
  PROCESANDO_FOTOS: 'procesando_fotos',
  VALIDANDO: 'validando',
  SOLICITANDO_INFO: 'solicitando_info',
  LISTO_PARA_PUBLICAR: 'listo_para_publicar',
  ESPERANDO_APROBACION: 'esperando_aprobacion',
  PUBLICANDO: 'publicando',
  COMPLETADO: 'completado',
  ERROR: 'error'
};

/**
 * @typedef {Object} Captacion
 * @property {string} id - ID único de la captación
 * @property {string} corredorId - ID del corredor
 * @property {string} telefono - Teléfono WhatsApp
 * @property {string} estado - Estado actual del flujo
 * @property {Object} datosExtraidos - Datos extraídos hasta ahora
 * @property {string[]} audiosRecibidos - URLs de audios
 * @property {string[]} fotosRecibidas - URLs de fotos
 * @property {string[]} fotosProcesadas - URLs de fotos procesadas
 * @property {string[]} camposFaltantes - Campos que aún faltan
 * @property {string[]} mensajesEnviados - Historial de mensajes
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Date} [expiresAt] - Expira si no hay actividad
 */

/**
 * Crea una nueva captación
 * @param {string} corredorId 
 * @param {string} telefono 
 * @returns {Captacion}
 */
export function crearCaptacion(corredorId, telefono) {
  return {
    id: crypto.randomUUID(),
    corredorId,
    telefono,
    estado: ESTADOS_CAPTACION.INICIO,
    datosExtraidos: {},
    audiosRecibidos: [],
    fotosRecibidas: [],
    fotosProcesadas: [],
    camposFaltantes: ['precio', 'superficie', 'banos', 'direccion'],
    mensajesEnviados: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
  };
}

/**
 * Actualiza el estado de una captación
 * @param {Captacion} captacion 
 * @param {string} nuevoEstado 
 * @param {Object} [datosAdicionales] 
 * @returns {Captacion}
 */
export function actualizarCaptacion(captacion, nuevoEstado, datosAdicionales = {}) {
  return {
    ...captacion,
    estado: nuevoEstado,
    ...datosAdicionales,
    updatedAt: new Date()
  };
}

/**
 * Verifica si la captación está completa (tiene todos los datos requeridos)
 * @param {Captacion} captacion 
 * @returns {boolean}
 */
export function captacionCompleta(captacion) {
  return captacion.camposFaltantes.length === 0;
}

/**
 * Campos obligatorios para publicar
 */
export const CAMPOS_OBLIGATORIOS = [
  'precio',
  'superficie',
  'banos',
  'direccion'
];

/**
 * Campos opcionales pero deseables
 */
export const CAMPOS_OPCIONALES = [
  'dormitorios',
  'estacionamientos',
  'bodega',
  'descripcion',
  'tipo'
];
