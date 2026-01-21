/**
 * Validadores de datos inmobiliarios
 * Los datos críticos (precio, m², baños) son SAGRADOS - no alucinamos
 */

/**
 * Valida y normaliza precio
 * @param {number|string} precio 
 * @param {string} moneda 
 * @returns {{valido: boolean, valor?: number, moneda?: string, error?: string}}
 */
export function validarPrecio(precio, moneda = 'CLP') {
  const valor = typeof precio === 'string'
    ? parseFloat(precio.replace(/[^0-9.-]/g, ''))
    : precio;

  if (isNaN(valor) || valor <= 0) {
    return { valido: false, error: 'Precio inválido o no detectado' };
  }

  // Rangos razonables para Chile
  const rangos = {
    CLP: { min: 10000000, max: 50000000000 },     // 10M - 50B CLP
    UF: { min: 500, max: 100000 },                 // 500 - 100k UF
    USD: { min: 10000, max: 50000000 }             // 10k - 50M USD
  };

  const rango = rangos[moneda] || rangos.CLP;

  if (valor < rango.min || valor > rango.max) {
    return {
      valido: false,
      error: `Precio fuera de rango esperado para ${moneda}: ${valor}`
    };
  }

  return { valido: true, valor, moneda };
}

/**
 * Valida superficie en m²
 * @param {number|string} superficie 
 * @returns {{valido: boolean, valor?: number, error?: string}}
 */
export function validarSuperficie(superficie) {
  const valor = typeof superficie === 'string'
    ? parseFloat(superficie.replace(/[^0-9.]/g, ''))
    : superficie;

  if (isNaN(valor) || valor <= 0) {
    return { valido: false, error: 'Superficie inválida o no detectada' };
  }

  // Rango razonable: 10m² - 10,000m²
  if (valor < 10 || valor > 10000) {
    return {
      valido: false,
      error: `Superficie fuera de rango: ${valor}m²`
    };
  }

  return { valido: true, valor };
}

/**
 * Valida cantidad de habitaciones (dormitorios, baños, etc.)
 * @param {number|string} cantidad 
 * @param {string} tipo 
 * @returns {{valido: boolean, valor?: number, error?: string}}
 */
export function validarCantidad(cantidad, tipo = 'habitaciones') {
  const valor = typeof cantidad === 'string'
    ? parseInt(cantidad, 10)
    : cantidad;

  if (isNaN(valor) || valor < 0) {
    return { valido: false, error: `${tipo} inválido` };
  }

  // Máximo razonable: 20
  if (valor > 20) {
    return {
      valido: false,
      error: `Cantidad de ${tipo} parece incorrecta: ${valor}`
    };
  }

  return { valido: true, valor };
}

/**
 * Valida datos completos de una captación
 * @param {object} datos 
 * @returns {{valido: boolean, errores: string[], warnings: string[]}}
 */
export function validarCaptacion(datos) {
  const errores = [];
  const warnings = [];

  // Campos obligatorios (sagrados)
  const camposObligatorios = ['precio', 'superficie', 'banos'];

  for (const campo of camposObligatorios) {
    if (!datos[campo]) {
      errores.push(`Falta campo obligatorio: ${campo}`);
    }
  }

  // Validaciones específicas
  if (datos.precio) {
    const resultadoPrecio = validarPrecio(datos.precio.valor, datos.precio.moneda);
    if (!resultadoPrecio.valido) {
      errores.push(resultadoPrecio.error);
    }
  }

  if (datos.superficie?.total) {
    const resultadoSup = validarSuperficie(datos.superficie.total);
    if (!resultadoSup.valido) {
      errores.push(resultadoSup.error);
    }
  }

  if (datos.banos !== undefined) {
    const resultadoBanos = validarCantidad(datos.banos, 'baños');
    if (!resultadoBanos.valido) {
      errores.push(resultadoBanos.error);
    }
  }

  // Warnings (no bloquean)
  if (!datos.direccion?.comuna) {
    warnings.push('No se detectó la comuna');
  }

  if (!datos.dormitorios) {
    warnings.push('No se detectó cantidad de dormitorios');
  }

  return {
    valido: errores.length === 0,
    errores,
    warnings
  };
}
