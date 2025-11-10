# Guía de Pruebas por Rol – App Carini

Correos de prueba:
- Administrador: `joinernix2@gmail.com`
- Cliente: `jo@gmail.com`
- Coordinador: `mauricio@gmail.com`
- Técnico: `eyder@gmail.com`

Nota: La contraseña se autocompleta en el componente de Login. Solo elige el rol correcto con el correo.

---

## 1) Cliente (jo@gmail.com)
Objetivo: Crear un mantenimiento con uno o varios equipos.

Pasos:
1. Iniciar sesión como Cliente.
2. Ir a Mis Equipos → verificar lista y detalles (marca, modelo, serial).
3. Crear Mantenimiento:
   - Elegir “Solicitar Mantenimiento”.
   - Seleccionar uno o varios equipos (multi-selección).
   - Tipo: Preventivo o Correctivo.
   - (Opcional) Adjuntar foto y descripción.
   - Enviar.
4. Ver que aparezca en la lista de mantenimientos del cliente con estado “Asignado” o “Pendiente”.

Criterios de verificación:
- Se puede seleccionar más de un equipo.
- Para Preventivo se muestra el checklist informativo por tipo (lavadora/secadora).
- El mantenimiento creado queda visible y con datos correctos.

---

## 2) Coordinador (mauricio@gmail.com)
Objetivo: Asignar y gestionar mantenimientos.

Pasos:
1. Iniciar sesión como Coordinador.
2. Ver la bandeja/lista de mantenimientos.
3. Abrir el mantenimiento creado por el cliente.
4. Asignar un técnico disponible (por ejemplo, `eyder@gmail.com`).
5. Confirmar fecha/turno si aplica.

Criterios de verificación:
- El mantenimiento cambia a “Asignado” y muestra el técnico asignado.
- Se actualiza la lista del técnico automáticamente o al refrescar.

---

## 3) Técnico (eyder@gmail.com)
Objetivo: Ejecutar y registrar el mantenimiento en campo.

Pasos:
1. Iniciar sesión como Técnico.
2. Ir a Mis Mantenimientos → ver el mantenimiento “Asignado”.
3. Iniciar Mantenimiento:
   - Capturar al menos una foto inicial por equipo (obligatorio).
   - Conceder permisos de ubicación (GPS).
   - Iniciar (el estado pasa a “En progreso”).
4. Mantenimiento en Progreso:
   - Ver checklist por equipo (lavadora/secadora) con casillas.
   - Marcar y desmarcar ítems; el progreso (X/Y) debe actualizarse.
   - El progreso se guarda automáticamente; al salir y volver debe cargar lo ya marcado.
   - Probar “Sugerir Cambio de Repuestos” (texto + foto opcional).
5. Pausar / Reanudar:
   - Pausar: selecciona motivo (opcional), el tiempo pausado se acumula.
   - Reanudar: retoma el tiempo.
6. Finalizar:
   - Antes de finalizar, verifica que el checklist esté como corresponde.
   - Finalizar el mantenimiento (estado “Completado”).

Criterios de verificación:
- Timer corre y respeta pausas (tiempo no crece mientras está pausado).
- Checklist: marcar/desmarcar persiste (GET/POST de progreso correctos).
- Guardado se fuerza al pausar/finalizar.
- Ícono de check es claro (azul marcado, gris vacío).

---

## 4) Administrador (joinernix2@gmail.com)
Objetivo: Supervisión general, catálogos y estadísticas.

Pasos:
1. Iniciar sesión como Administrador.
2. Revisar listados de clientes, equipos y mantenimientos.
3. Validar estadísticas/resumen (asignados, en progreso, completados).
4. (Opcional) Crear/editar equipos del catálogo.

Criterios de verificación:
- Los estados de mantenimiento concuerdan con el flujo del técnico.
- Los equipos y clientes muestran datos consistentes.

---

## Escenarios de prueba recomendados
- Preventivo con 1 lavadora: marcar todos los ítems y finalizar.
- Preventivo con 1 secadora: marcar parcialmente, pausar, reanudar y finalizar.
- Multi-equipo (lavadora + secadora): marcar subsets distintos por equipo.
- Desmarcar un ítem intermedio (ej. de [0,1,2,3] pasar a [0,1,3]) y validar que el backend reciba los índices exactos.
- Reset (dejar un equipo sin checks): backend debe guardar `completed_indices: []` y `status: pending`.

---

## Notas y tips
- Si al iniciar no se cargan checks previos, refresca la pantalla; el progreso se rehidrata con GET al entrar y al reenfocar.
- Asegura permisos de cámara y ubicación para iniciar y documentar el mantenimiento.
- En Android, el botón “atrás” está bloqueado en “En Progreso”; debes pausar o finalizar.


