/**
 * Función de redondeo inteligente para valores nutricionales
 * - Si el número es menor a 1, muestra al menos 1 decimal (0.4 -> 0.4, no 0)
 * - Si el número es >= 1, redondea a 1 decimal
 * - Para números muy complicados, redondea hacia arriba si es necesario
 * 
 * @param {number} value - Valor a redondear
 * @param {number} decimals - Número de decimales (por defecto 1)
 * @returns {string} - Valor formateado como string
 */
export const formatNutrient = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const num = parseFloat(value);
  
  // Si es menor a 1, siempre mostrar al menos 1 decimal
  if (Math.abs(num) < 1) {
    // Redondear hacia arriba si tiene muchos decimales
    const rounded = Math.ceil(num * 10) / 10;
    return rounded.toFixed(1);
  }
  
  // Si es >= 1, redondear a 1 decimal
  // Usar Math.ceil para redondear hacia arriba en casos complicados
  const rounded = Math.round(num * 10) / 10;
  return rounded.toFixed(1);
};

/**
 * Formatea un número para mostrar sin decimales innecesarios
 * pero manteniendo precisión cuando es necesario
 */
export const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const num = parseFloat(value);
  
  // Si es menor a 1, siempre mostrar al menos 1 decimal
  if (Math.abs(num) < 1) {
    const rounded = Math.ceil(num * 10) / 10;
    return rounded.toFixed(decimals);
  }
  
  // Si es >= 1, redondear a los decimales especificados
  const rounded = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return rounded.toFixed(decimals);
};

