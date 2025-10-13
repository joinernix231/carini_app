const fs = require('fs');
const path = require('path');

// Crear directorio de assets si no existe
const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Crear archivo de notificación de sonido (placeholder)
const notificationSoundPath = path.join(assetsDir, 'notification-sound.wav');
if (!fs.existsSync(notificationSoundPath)) {
  // Crear un archivo de sonido simple (esto es un placeholder)
  fs.writeFileSync(notificationSoundPath, '');
  console.log('✅ Archivo de sonido de notificación creado (placeholder)');
}

// Crear icono de notificación (placeholder)
const notificationIconPath = path.join(assetsDir, 'notification-icon.png');
if (!fs.existsSync(notificationIconPath)) {
  // Copiar el icono principal como icono de notificación
  const mainIconPath = path.join(assetsDir, 'icon.png');
  if (fs.existsSync(mainIconPath)) {
    fs.copyFileSync(mainIconPath, notificationIconPath);
    console.log('✅ Icono de notificación creado');
  }
}

console.log('🎨 Assets generados correctamente');
console.log('📝 Nota: Reemplaza los archivos placeholder con assets reales antes de la producción');

