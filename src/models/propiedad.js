/**
 * Schema de Propiedad Inmobiliaria
 * Representa una propiedad captada
 */

/**
 * @typedef {Object} Precio
 * @property {number} valor - Valor numérico
 * @property {string} moneda - CLP, UF, USD
 */

/**
 * @typedef {Object} Superficie
 * @property {number} total - Superficie total en m²
 * @property {number} [util] - Superficie útil en m²
 * @property {string} unidad - Siempre 'm2'
 */

/**
 * @typedef {Object} Direccion
 * @property {string} calle - Nombre de la calle
 * @property {string} [numero] - Número de la propiedad
 * @property {string} comuna - Comuna
 * @property {string} [region] - Región
 * @property {Object} [coordenadas] - Lat/lng
 */

/**
 * @typedef {Object} Propiedad
 * @property {string} id - ID único
 * @property {string} tipo - casa, departamento, oficina, terreno, local
 * @property {string} operacion - venta, arriendo
 * @property {Precio} precio
 * @property {Superficie} superficie
 * @property {number} dormitorios
 * @property {number} banos
 * @property {number} [estacionamientos]
 * @property {boolean} [bodega]
 * @property {Direccion} direccion
 * @property {string} descripcion
 * @property {string[]} fotos - URLs de fotos procesadas
 * @property {string[]} usps - Unique Selling Points
 * @property {string} estado - borrador, pendiente, publicado
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * Crea una propiedad con valores por defecto
 * @param {Partial<Propiedad>} datos 
 * @returns {Propiedad}
 */
export function crearPropiedad(datos = {}) {
  return {
    id: datos.id || crypto.randomUUID(),
    tipo: datos.tipo || 'departamento',
    operacion: datos.operacion || 'venta',
    precio: datos.precio || { valor: 0, moneda: 'CLP' },
    superficie: datos.superficie || { total: 0, unidad: 'm2' },
    dormitorios: datos.dormitorios || 0,
    banos: datos.banos || 0,
    estacionamientos: datos.estacionamientos || 0,
    bodega: datos.bodega || false,
    direccion: datos.direccion || {},
    descripcion: datos.descripcion || '',
    fotos: datos.fotos || [],
    usps: datos.usps || [],
    estado: datos.estado || 'borrador',
    createdAt: datos.createdAt || new Date(),
    updatedAt: new Date()
  };
}

/**
 * Tipos de propiedad válidos
 */
export const TIPOS_PROPIEDAD = [
  'casa',
  'departamento',
  'oficina',
  'terreno',
  'local',
  'bodega',
  'estacionamiento'
];

/**
 * Tipos de operación válidos
 */
export const TIPOS_OPERACION = ['venta', 'arriendo'];

/**
 * Estados de la propiedad
 */
export const ESTADOS_PROPIEDAD = [
  'borrador',      // En proceso de captación
  'pendiente',     // Esperando aprobación del corredor
  'aprobado',      // Aprobado, listo para publicar
  'publicado',     // Ya publicado en CRMs
  'pausado',       // Pausado temporalmente
  'vendido'        // Operación cerrada
];
