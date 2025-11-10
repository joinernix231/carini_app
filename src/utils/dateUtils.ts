/**
 * Formatea una fecha a formato YYYY-MM-DD usando valores locales
 * para evitar problemas de zona horaria al convertir a UTC
 * 
 * @param date - Fecha a formatear
 * @returns String en formato YYYY-MM-DD
 */
export const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD usando valores locales
 * 
 * @returns String en formato YYYY-MM-DD
 */
export const getTodayLocal = (): string => {
  return formatDateToLocal(new Date());
};

