// Script de prueba para verificar la integración con la API
// Este archivo es solo para testing y puede ser eliminado después

import TecnicoMantenimientosService from '../services/TecnicoMantenimientosService';

// Función de prueba para verificar la conexión con la API
export const testTecnicoMantenimientosAPI = async (token: string) => {
  console.log('🧪 Iniciando pruebas de la API de mantenimientos de técnicos...');
  
  try {
    // Prueba 1: Obtener todos los mantenimientos
    console.log('📋 Prueba 1: Obteniendo todos los mantenimientos...');
    const allMaintenances = await TecnicoMantenimientosService.getMaintenances(token);
    console.log('✅ Todos los mantenimientos:', allMaintenances);
    
    // Prueba 2: Obtener mantenimientos asignados
    console.log('📋 Prueba 2: Obteniendo mantenimientos asignados...');
    const assignedMaintenances = await TecnicoMantenimientosService.getMaintenancesByStatus(token, 'assigned');
    console.log('✅ Mantenimientos asignados:', assignedMaintenances);
    
    // Prueba 3: Obtener mantenimientos de hoy
    console.log('📋 Prueba 3: Obteniendo mantenimientos de hoy...');
    const todayMaintenances = await TecnicoMantenimientosService.getTodayMaintenances(token);
    console.log('✅ Mantenimientos de hoy:', todayMaintenances);
    
    // Prueba 4: Obtener estadísticas
    console.log('📋 Prueba 4: Obteniendo estadísticas...');
    const stats = await TecnicoMantenimientosService.getMaintenancesStats(token);
    console.log('✅ Estadísticas:', stats);
    
    console.log('🎉 Todas las pruebas completadas exitosamente!');
    return true;
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    return false;
  }
};

// Función para probar el formato de fechas
export const testDateFormatting = () => {
  console.log('🧪 Probando formato de fechas...');
  
  const testDate = '2024-01-15';
  const testDateTime = '2024-01-15T10:30:00.000000Z';
  
  console.log('📅 Fecha formateada:', TecnicoMantenimientosService.formatDate(testDate));
  console.log('🕐 Fecha y hora formateada:', TecnicoMantenimientosService.formatDateTime(testDateTime));
  
  console.log('✅ Pruebas de formato completadas!');
};

// Función para probar utilidades de estado
export const testStatusUtilities = () => {
  console.log('🧪 Probando utilidades de estado...');
  
  const statuses: Array<'assigned' | 'in_progress' | 'completed'> = ['assigned', 'in_progress', 'completed'];
  
  statuses.forEach(status => {
    console.log(`📊 Estado: ${status}`);
    console.log(`   Texto: ${TecnicoMantenimientosService.getStatusText(status)}`);
    console.log(`   Color: ${TecnicoMantenimientosService.getStatusColor(status)}`);
  });
  
  console.log('✅ Pruebas de utilidades completadas!');
};

// Función para probar iconos de equipos
export const testEquipmentIcons = () => {
  console.log('🧪 Probando iconos de equipos...');
  
  const equipmentNames = [
    'Lavadora Industrial',
    'Secadora Electrolux',
    'Centrífuga Whirlpool',
    'Equipo Desconocido'
  ];
  
  equipmentNames.forEach(name => {
    console.log(`🔧 Equipo: ${name} -> Icono: ${TecnicoMantenimientosService.getEquipmentIcon(name)}`);
  });
  
  console.log('✅ Pruebas de iconos completadas!');
};

// Función principal de pruebas
export const runAllTests = async (token: string) => {
  console.log('🚀 Iniciando todas las pruebas...');
  
  // Pruebas de utilidades (no requieren API)
  testDateFormatting();
  testStatusUtilities();
  testEquipmentIcons();
  
  // Pruebas de API (requieren token)
  if (token) {
    await testTecnicoMantenimientosAPI(token);
  } else {
    console.log('⚠️ No se proporcionó token, saltando pruebas de API');
  }
  
  console.log('🏁 Todas las pruebas completadas!');
};


