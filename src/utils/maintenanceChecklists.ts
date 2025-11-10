/**
 * Checklists estáticos de mantenimiento por tipo de equipo
 * Estos son los items que el técnico debe completar durante el mantenimiento
 */

export const MAINTENANCE_CHECKLISTS: Record<string, string[]> = {
  lavadora: [
    'Alineación y tensión correas',
    'Limpieza y regulación válvulas solenoides',
    'Inspección de empaques',
    'Inspección de cierre',
    'Ajuste y limpieza cofre eléctrico',
    'Revisión tarjeta electrónica',
    'Engrase y revisión rodamientos del sistema motriz',
    'Inspección de los rodamientos del motor',
    'Revisión parámetros variador',
  ],
  secadora: [
    'Alineación y tensión correas',
    'Limpieza tapas posteriores',
    'Inspección de empaques',
    'Inspección de cierre',
    'Ajuste y limpieza cofre eléctrico',
    'Revisión tarjeta electrónica',
    'Engrase y revisión chumaceras',
  ],
  centrífuga: [
    'Alineación y tensión correas',
    'Inspección de empaques',
    'Inspección de cierre',
    'Ajuste y limpieza cofre eléctrico',
    'Revisión tarjeta electrónica',
  ],
  centrifugadora: [ // Alias por si viene de otra forma
    'Alineación y tensión correas',
    'Inspección de empaques',
    'Inspección de cierre',
    'Ajuste y limpieza cofre eléctrico',
    'Revisión tarjeta electrónica',
  ],
};

/**
 * Obtiene el checklist para un tipo de equipo específico
 */
export function getChecklistForDeviceType(deviceType: string): string[] {
  const normalizedType = deviceType.toLowerCase().trim();
  return MAINTENANCE_CHECKLISTS[normalizedType] || [];
}

/**
 * Obtiene el total de items del checklist para un tipo de equipo
 */
export function getChecklistCount(deviceType: string): number {
  return getChecklistForDeviceType(deviceType).length;
}



