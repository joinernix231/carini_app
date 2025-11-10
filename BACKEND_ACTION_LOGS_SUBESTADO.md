# 📋 Guía: Implementar "En Camino" usando Action Logs

## 🎯 ¿Qué queremos lograr?

Queremos que cuando un técnico presione el botón "En Camino" en la app, el sistema registre esta acción y permita saber en qué momento exacto el técnico está yendo hacia el lugar del mantenimiento.

**La idea es simple:**
- En lugar de agregar un nuevo estado al enum principal (que complicaría las cosas)
- Usamos la tabla `maintenance_action_logs` que ya existe
- Agregamos una bandera `is_last` para saber cuál es la última acción del técnico
- Así podemos mostrar "En Camino" sin cambiar el estado principal del mantenimiento

---

## 📊 Paso 1: Cambios en la Base de Datos

### ¿Qué hay que hacer?

Agregar una nueva columna llamada `is_last` a la tabla `maintenance_action_logs`. Esta columna será un booleano (true/false) que nos dirá si ese log es el último registro de acciones para ese mantenimiento.

**¿Por qué?**
- Así podemos saber rápidamente cuál fue la última acción del técnico
- No tenemos que buscar entre todos los logs cada vez
- Es más eficiente y rápido

### Migración

Necesitas crear una migración que:
1. Agregue la columna `is_last` (tipo boolean, valor por defecto `false`)
2. Marque automáticamente el último log de cada mantenimiento existente como `is_last = true`
3. Agregue un índice para que las búsquedas sean rápidas

**Nota:** El código de la migración está en los ejemplos técnicos al final, pero básicamente es agregar una columna y actualizar los registros existentes.

---

## 🔧 Paso 2: Agregar la acción "on_the_way"

### ¿Qué hay que hacer?

En la tabla `maintenance_action_logs`, el campo `action` es un enum (una lista de valores permitidos). Actualmente tiene:
- `assign` (asignado)
- `start` (iniciado)
- `pause` (pausado)
- `resume` (reanudado)
- `end` (finalizado)

**Necesitas agregar:**
- `on_the_way` (en camino)

Esto se hace en la migración original de la tabla o en una nueva migración que modifique el enum.

---

## 🎯 Paso 3: Crear el nuevo endpoint

### ¿Qué hace este endpoint?

Cuando el técnico presiona "En Camino" en la app, la app llama a este endpoint con:
- El ID del mantenimiento
- La ubicación GPS (latitud y longitud)

El endpoint debe:
1. Verificar que el técnico esté autenticado
2. Verificar que el mantenimiento esté asignado a ese técnico
3. Verificar que el mantenimiento esté en estado `assigned`
4. Crear un nuevo registro en `maintenance_action_logs` con:
   - `action = 'on_the_way'`
   - `is_last = true`
   - La ubicación GPS
   - La fecha y hora actual
5. Marcar todos los logs anteriores de ese mantenimiento como `is_last = false`

### Ruta del endpoint

```
POST /api/technicianMaintenances/{maintenanceId}/onTheWay
```

**Importante:** Usa camelCase (`onTheWay`) en lugar de guiones (`on-the-way`).

### Datos que recibe (Body)

```json
{
  "latitude": 4.6130027,
  "longitude": -74.1933967
}
```

### Respuesta exitosa

```json
{
  "success": true,
  "data": {
    "id": 5,
    "maintenance_id": 11,
    "technician_id": 3,
    "action": "on_the_way",
    "timestamp": "2025-01-15T10:30:00.000000Z",
    "latitude": "4.61300270",
    "longitude": "-74.19339670",
    "is_last": true
  },
  "message": "Mantenimiento marcado como 'En Camino' exitosamente"
}
```

### Validaciones importantes

1. **Latitud y longitud son obligatorias** y deben ser números válidos
2. **El técnico debe estar autenticado**
3. **El mantenimiento debe existir**
4. **El mantenimiento debe estar asignado a ese técnico**
5. **El estado del mantenimiento debe ser `assigned`**

Si alguna validación falla, devolver un error apropiado.

---

## 🔄 Paso 4: Actualizar endpoints existentes

### ¿Qué hay que hacer?

Los endpoints que ya existen para iniciar, pausar, reanudar y completar mantenimientos también deben crear logs en `maintenance_action_logs`.

**Endpoints a actualizar:**
1. `POST /api/technicianMaintenances/{id}/start` → Crear log con `action = 'start'`
2. `POST /api/technicianMaintenances/{id}/pause` → Crear log con `action = 'pause'`
3. `POST /api/technicianMaintenances/{id}/resume` → Crear log con `action = 'resume'`
4. `POST /api/technicianMaintenances/{id}/complete` → Crear log con `action = 'end'`

**En cada uno:**
- Después de actualizar el mantenimiento
- Crear un nuevo log con `is_last = true`
- Marcar los logs anteriores como `is_last = false`

---

## 📤 Paso 5: Incluir `last_action_log` en las respuestas

### ¿Qué hay que hacer?

Cuando se obtiene el detalle de un mantenimiento (por ejemplo, `GET /api/technicianMaintenances/{id}`), la respuesta debe incluir el último log de acción.

**Esto permite al frontend saber:**
- Cuál fue la última acción del técnico
- Si está "En Camino", "Iniciado", "Pausado", etc.
- Mostrar la información correcta en la pantalla

### Ejemplo de respuesta

```json
{
  "success": true,
  "data": {
    "id": 11,
    "status": "assigned",
    "type": "preventive",
    ...
    "last_action_log": {
      "id": 5,
      "action": "on_the_way",
      "timestamp": "2025-01-15T10:30:00.000000Z",
      "latitude": "4.61300270",
      "longitude": "-74.19339670",
      "is_last": true
    }
  }
}
```

---

## 🧠 Lógica para manejar `is_last`

### ¿Cómo funciona?

Cada vez que se crea un nuevo log de acción:

1. **Primero:** Buscar todos los logs del mantenimiento que tengan `is_last = true` y marcarlos como `is_last = false`
2. **Segundo:** Crear el nuevo log con `is_last = true`

**¿Por qué así?**
- Solo puede haber UN log con `is_last = true` por mantenimiento
- Siempre sabemos cuál es la última acción
- Es fácil y rápido de consultar

### Ejemplo de flujo

1. Técnico presiona "En Camino"
   - Se crea log: `action = 'on_the_way'`, `is_last = true`
   
2. Técnico presiona "Iniciar Mantenimiento"
   - Se marca el log anterior como `is_last = false`
   - Se crea nuevo log: `action = 'start'`, `is_last = true`

3. Técnico pausa el mantenimiento
   - Se marca el log anterior como `is_last = false`
   - Se crea nuevo log: `action = 'pause'`, `is_last = true`

---

## ✅ Checklist de implementación

### Base de datos
- [ ] Crear migración para agregar columna `is_last`
- [ ] Actualizar registros existentes para marcar el último log de cada mantenimiento
- [ ] Agregar índice para optimizar búsquedas
- [ ] Actualizar enum de acciones para incluir `'on_the_way'`

### Modelos y servicios
- [ ] Actualizar modelo `MaintenanceActionLog` para incluir `is_last`
- [ ] Crear servicio o método para manejar la lógica de `is_last`
- [ ] Asegurar que solo un log tenga `is_last = true` por mantenimiento

### Endpoints
- [ ] Crear endpoint `POST /api/technicianMaintenances/{id}/onTheWay`
- [ ] Actualizar endpoint `start` para crear log
- [ ] Actualizar endpoint `pause` para crear log
- [ ] Actualizar endpoint `resume` para crear log
- [ ] Actualizar endpoint `complete` para crear log
- [ ] Actualizar endpoint de detalle para incluir `last_action_log`

### Validaciones
- [ ] Validar que el técnico esté autenticado
- [ ] Validar que el mantenimiento esté asignado al técnico
- [ ] Validar que el estado permita la acción
- [ ] Validar coordenadas GPS (latitud y longitud)

### Testing
- [ ] Probar que se crea el log correctamente
- [ ] Probar que `is_last` se actualiza correctamente
- [ ] Probar que solo un log tiene `is_last = true`
- [ ] Probar validaciones de seguridad
- [ ] Probar que el endpoint responde correctamente

---

## 📊 Ejemplo de flujo completo

### Escenario: Técnico va a realizar un mantenimiento

1. **Técnico ve el mantenimiento asignado**
   - Estado: `assigned`
   - Último log: `action = 'assign'`

2. **Técnico presiona "En Camino"**
   - App llama: `POST /api/technicianMaintenances/11/onTheWay`
   - Backend crea log: `action = 'on_the_way'`, `is_last = true`
   - Estado sigue siendo: `assigned` (no cambia)
   - Frontend muestra: "En Camino" (basado en `last_action_log`)

3. **Técnico llega y presiona "Iniciar Mantenimiento"**
   - App llama: `POST /api/technicianMaintenances/11/start`
   - Backend actualiza estado: `in_progress`
   - Backend crea log: `action = 'start'`, `is_last = true`
   - Log anterior (`on_the_way`) se marca como `is_last = false`
   - Frontend muestra: "En Progreso"

4. **Técnico completa el mantenimiento**
   - App llama: `POST /api/technicianMaintenances/11/complete`
   - Backend actualiza estado: `completed`
   - Backend crea log: `action = 'end'`, `is_last = true`
   - Frontend muestra: "Completado"

---

## 🚨 Consideraciones importantes

### 1. Transacciones

Cuando creas un nuevo log, hazlo dentro de una transacción de base de datos. Esto asegura que:
- Si algo falla, no quede un log con `is_last = true` sin que el anterior se haya marcado como `false`
- Todo se hace de forma atómica (todo o nada)

### 2. Seguridad

- Siempre verificar que el técnico esté autenticado
- Siempre verificar que el mantenimiento esté asignado a ese técnico
- No permitir que un técnico modifique mantenimientos de otros

### 3. Validaciones

- Las coordenadas GPS deben ser válidas (latitud entre -90 y 90, longitud entre -180 y 180)
- El estado del mantenimiento debe permitir la acción
- No permitir acciones inválidas (ej: iniciar un mantenimiento que ya está completado)

### 4. Performance

- Usar índices en la base de datos para que las búsquedas sean rápidas
- No cargar todos los logs si solo necesitas el último
- Usar relaciones de Eloquent para cargar datos relacionados de forma eficiente

---

## 🎉 Resultado final

Con esta implementación:

1. ✅ No necesitas agregar `'en_camino'` al enum de estados principal
2. ✅ Tienes un historial completo de todas las acciones del técnico
3. ✅ Puedes mostrar subestados granulares en el frontend (como "En Camino")
4. ✅ Es fácil agregar nuevas acciones en el futuro
5. ✅ La consulta del último estado es eficiente gracias a `is_last`

**El frontend puede usar `last_action_log.action` para determinar el subestado y mostrar la información correcta en la pantalla.**

---

## 📝 Notas adicionales

### ¿Por qué no agregar `'en_camino'` al enum de estados?

- El enum de estados principal (`pending`, `quoted`, `assigned`, `in_progress`, `completed`, etc.) representa el estado general del mantenimiento
- "En Camino" es más bien una acción temporal del técnico, no un estado permanente
- Usar `action_logs` nos permite tener un historial completo y detallado
- Es más flexible para agregar nuevas acciones en el futuro

### ¿Qué pasa si hay un error?

- Si algo falla al crear el log, la transacción se revierte
- El mantenimiento no cambia de estado
- El técnico puede intentar de nuevo
- Los logs anteriores no se afectan

### ¿Cómo se usa en el frontend?

El frontend ya está preparado para:
- Llamar al endpoint `onTheWay` cuando el técnico presiona el botón
- Mostrar "En Camino" cuando `last_action_log.action === 'on_the_way'`
- Validar que el estado sea `en_camino` antes de permitir iniciar el mantenimiento

---

## 🔍 Ejemplos de código (para referencia técnica)

Si necesitas ver ejemplos de código específicos, puedes consultar la documentación técnica de Laravel o pedir ayuda al equipo de desarrollo. Los conceptos principales están explicados arriba de forma simple.

**Puntos clave a recordar:**
- Agregar columna `is_last` a `maintenance_action_logs`
- Agregar `'on_the_way'` al enum de acciones
- Crear endpoint `POST /api/technicianMaintenances/{id}/onTheWay`
- Actualizar endpoints existentes para crear logs
- Incluir `last_action_log` en las respuestas
- Manejar `is_last` correctamente (solo uno debe ser `true`)
