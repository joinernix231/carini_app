# 📋 Documentación: Confirmación de Mantenimientos por Cliente

## 🎯 Objetivo
Implementar un sistema donde el cliente debe confirmar el mantenimiento después de que el coordinador asigne un técnico, fecha y turno. Si el cliente no confirma en 1 hora, el coordinador debe ser notificado para llamar al cliente.

---

## 🔄 Flujo de Negocio

### **Paso 1: Coordinador Asigna Técnico**
```
Cuando el coordinador asigna técnico + fecha + turno:
├─ Se activa la confirmación requerida
├─ Se establece un plazo de 1 hora para confirmar
└─ Se notifica al cliente que debe confirmar
```

**¿Qué debe hacer el backend?**
- Actualizar el mantenimiento con:
  - Estado: `assigned`
  - `confirmation_required`: `true`
  - `confirmation_deadline`: fecha actual + 1 hora
  - Técnico asignado, fecha y turno
- Enviar notificación al cliente

---

### **Paso 2: Cliente Confirma Mantenimiento**
```
El cliente recibe notificación y puede confirmar:
├─ Opción A: Confirma → Técnico puede iniciar
└─ Opción B: No confirma → Después de 1 hora notificar coordinador
```

**¿Qué debe hacer el backend?**
- Recibir confirmación del cliente
- Validar que el cliente es el dueño del mantenimiento
- Validar que el mantenimiento está en estado `assigned`
- Registrar fecha de confirmación
- Desactivar el requerimiento de confirmación
- Notificar al técnico que puede iniciar
- Notificar al coordinador que el cliente confirmó

---

### **Paso 3: Si Cliente No Confirma (Después de 1 hora)**
```
El sistema detecta que pasó 1 hora sin confirmar:
├─ Notifica al coordinador
└─ Marca que el coordinador fue notificado
```

**¿Qué debe hacer el backend?**
- Verificar cada minuto los mantenimientos sin confirmar
- Buscar mantenimientos donde:
  - Estado = `assigned`
  - `confirmation_required` = `true`
  - `confirmed_at` = `null`
  - `confirmation_deadline` <= hora actual
  - `coordinator_notified` = `false`
- Para cada uno encontrado:
  - Enviar notificación al coordinador
  - Marcar que el coordinador fue notificado

---

### **Paso 4: Coordinador Llama al Cliente (Opcional)**
```
El coordinador puede marcar que ya llamó:
└─ Se registra la fecha de la llamada
```

**¿Qué debe hacer el backend?**
- Recibir solicitud del coordinador para marcar como "llamado"
- Validar que el usuario es coordinador
- Registrar fecha de llamada
- Marcar como llamado

---

## 📡 Endpoints Necesarios

### **1. Confirmar Mantenimiento (Cliente)**
```
POST /api/maintenances/{maintenanceId}/confirm

Headers:
- Authorization: Bearer {token}

Body:
(No requiere body, todo viene del token)

Respuesta Éxito:
{
  "success": true,
  "message": "Mantenimiento confirmado exitosamente",
  "data": {
    "id": 123,
    "status": "assigned",
    "confirmation_required": false,
    "confirmed_at": "2025-01-15T10:30:00Z",
    // ... resto de datos del mantenimiento
  }
}

Respuesta Error:
{
  "success": false,
  "message": "Este mantenimiento no puede ser confirmado en este momento"
}
```

**Validaciones:**
- El usuario debe ser cliente
- El cliente debe ser dueño del mantenimiento
- El estado debe ser `assigned`
- `confirmation_required` debe ser `true`
- No debe estar ya confirmado

---

### **2. Marcar como Llamado (Coordinador) - OPCIONAL**
```
POST /api/maintenances/{maintenanceId}/mark-as-called

Headers:
- Authorization: Bearer {token}

Body:
(No requiere body)

Respuesta Éxito:
{
  "success": true,
  "message": "Marcado como llamado",
  "data": {
    "id": 123,
    "coordinator_called": true,
    "coordinator_called_at": "2025-01-15T11:30:00Z"
  }
}
```

**Validaciones:**
- El usuario debe ser coordinador
- El coordinador debe ser el asignado al mantenimiento

---

### **3. Obtener Mantenimientos Sin Confirmar (Coordinador)**
```
GET /api/coordinator/maintenances/unconfirmed

Headers:
- Authorization: Bearer {token}

Respuesta:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "client": {
        "id": 1,
        "name": "Juan Pérez",
        "phone": "3001234567"
      },
      "technician": {
        "id": 5,
        "user": {
          "name": "Carlos Técnico"
        }
      },
      "date_maintenance": "2025-01-20",
      "shift": "AM",
      "confirmation_deadline": "2025-01-15T10:00:00Z",
      "coordinator_notified": true,
      "coordinator_notified_at": "2025-01-15T10:05:00Z"
    }
  ]
}
```

---

## 🔔 Notificaciones a Enviar

### **1. Notificación al Cliente: Técnico Asignado**
**Cuándo:** Cuando el coordinador asigna técnico

**Contenido:**
```
Título: "Técnico Asignado - Confirma tu Mantenimiento"

Mensaje: "Se ha asignado el técnico {nombre_tecnico} para el {fecha} ({turno}). Por favor confirma tu mantenimiento."

Datos adicionales:
- type: "maintenance_assigned_requires_confirmation"
- maintenance_id: {id}
- screen: "DetalleMantenimiento"
```

---

### **2. Notificación al Coordinador: Cliente No Confirmó**
**Cuándo:** Después de 1 hora sin confirmar

**Contenido:**
```
Título: "🚨 Cliente No Ha Confirmado Mantenimiento"

Mensaje: "{nombre_cliente} no ha confirmado el mantenimiento #{id} programado para {fecha}. Por favor, llámalo."

Datos adicionales:
- type: "maintenance_unconfirmed"
- maintenance_id: {id}
- client_id: {id}
- client_phone: {teléfono}
- screen: "DetalleMantenimiento"
```

---

### **3. Notificación al Coordinador: Cliente Confirmó**
**Cuándo:** Cuando el cliente confirma

**Contenido:**
```
Título: "✅ Cliente Confirmó Mantenimiento"

Mensaje: "{nombre_cliente} ha confirmado el mantenimiento #{id}. El técnico puede iniciar."

Datos adicionales:
- type: "maintenance_confirmed"
- maintenance_id: {id}
- screen: "DetalleMantenimiento"
```

---

### **4. Notificación al Técnico: Mantenimiento Confirmado**
**Cuándo:** Cuando el cliente confirma

**Contenido:**
```
Título: "✅ Mantenimiento Confirmado"

Mensaje: "El cliente ha confirmado el mantenimiento programado para {fecha} ({turno}). Ya puedes iniciar."

Datos adicionales:
- type: "maintenance_confirmed"
- maintenance_id: {id}
- screen: "DetalleMantenimiento"
```

---

## 📊 Campos en la Base de Datos

### **Tabla: `maintenances`**

Agregar estos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `confirmation_required` | boolean | Si requiere confirmación del cliente (default: false) |
| `confirmed_at` | timestamp | Fecha y hora en que el cliente confirmó (nullable) |
| `confirmation_deadline` | timestamp | Fecha límite para confirmar (nullable) |
| `coordinator_notified` | boolean | Si el coordinador ya fue notificado (default: false) |
| `coordinator_notified_at` | timestamp | Fecha en que se notificó al coordinador (nullable) |
| `coordinator_called` | boolean | Si el coordinador ya llamó al cliente (default: false) |
| `coordinator_called_at` | timestamp | Fecha en que el coordinador llamó (nullable) |

---

## 🔧 Cambios en Funcionalidades Existentes

### **1. Al Asignar Técnico (Método existente)**
**Modificar:**
- Cuando se asigna técnico, además de actualizar el estado a `assigned`:
  - Activar `confirmation_required` = `true`
  - Establecer `confirmation_deadline` = ahora + 1 hora
  - Enviar notificación al cliente (nueva notificación)

---

### **2. Al Iniciar Mantenimiento (Técnico)**
**Agregar validación:**
- Antes de permitir que el técnico inicie, verificar:
  - Si `confirmation_required` = `true` Y `confirmed_at` = `null`
  - Entonces: **NO permitir iniciar** y retornar error:
    ```
    "El cliente aún no ha confirmado este mantenimiento. No puedes iniciarlo."
    ```

---

## ⏰ Tarea Programada (Cron Job)

**Frecuencia:** Cada minuto

**Qué hace:**
1. Busca mantenimientos donde:
   - `status` = `assigned`
   - `confirmation_required` = `true`
   - `confirmed_at` = `null`
   - `confirmation_deadline` <= hora actual
   - `coordinator_notified` = `false`

2. Para cada uno encontrado:
   - Envía notificación al coordinador
   - Actualiza `coordinator_notified` = `true`
   - Guarda `coordinator_notified_at` = ahora

---

## 📝 Resumen de Qué Hacer

### **Paso 1: Base de Datos**
- [ ] Crear migración agregando los 7 campos nuevos
- [ ] Ejecutar migración

### **Paso 2: Modelo**
- [ ] Agregar campos al `$fillable`
- [ ] Agregar campos al `$casts` (datetime para timestamps, boolean para booleanos)

### **Paso 3: Endpoints**
- [ ] Crear endpoint `POST /maintenances/{id}/confirm` (cliente confirma)
- [ ] Crear endpoint `POST /maintenances/{id}/mark-as-called` (opcional, coordinador marca llamado)
- [ ] Crear endpoint `GET /coordinator/maintenances/unconfirmed` (opcional, lista sin confirmar)

### **Paso 4: Modificar Asignación**
- [ ] En el método donde se asigna técnico:
  - Activar `confirmation_required`
  - Establecer `confirmation_deadline`
  - Enviar notificación al cliente

### **Paso 5: Notificaciones**
- [ ] Crear notificación `TecnicoAsignadoRequiereConfirmacion` (cliente)
- [ ] Crear notificación `ClienteNoConfirmoMantenimiento` (coordinador)
- [ ] Crear notificación `ClienteConfirmoMantenimiento` (coordinador)
- [ ] Crear notificación `MantenimientoConfirmadoPorCliente` (técnico)

### **Paso 6: Tarea Programada**
- [ ] Crear scheduled task que verifique cada minuto
- [ ] Enviar notificaciones a coordinadores cuando pase 1 hora

### **Paso 7: Validación Técnico**
- [ ] En el método donde técnico inicia mantenimiento:
  - Validar que esté confirmado antes de permitir iniciar

### **Paso 8: Respuestas API**
- [ ] Actualizar `MaintenanceResource` para incluir los nuevos campos en las respuestas

---

## 🎯 Flujo Completo Visual

```
┌─────────────────────────────────────────┐
│ 1. COORDINADOR ASIGNA TÉCNICO          │
│    - Estado: assigned                   │
│    - confirmation_required: true       │
│    - confirmation_deadline: +1 hora    │
│    └─> Notifica al CLIENTE             │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 2. CLIENTE RECIBE NOTIFICACIÓN         │
│    "Confirma tu mantenimiento"         │
└─────────────────────────────────────────┘
              │
      ┌───────┴───────┐
      │               │
      ▼               ▼
┌──────────┐   ┌──────────────┐
│ CONFIRMA │   │ NO CONFIRMA  │
│          │   │              │
│ - confirmed_at │ - Pasa 1 hora │
│ - confirmation_required: false │ - Job detecta │
│ └─> Notifica TÉCNICO │ └─> Notifica │
│ └─> Notifica COORDINADOR │   COORDINADOR │
└──────────┘   └──────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ COORDINADOR  │
              │ RECIBE NOTIF │
              │              │
              │ Puede llamar │
              │ (opcional)   │
              └──────────────┘
```

---

## ✅ Checklist de Implementación

1. **Base de Datos**
   - [ ] Migración creada y ejecutada
   - [ ] Campos agregados al modelo

2. **Endpoints**
   - [ ] Endpoint confirmar mantenimiento
   - [ ] Endpoint marcar como llamado (opcional)
   - [ ] Endpoint listar sin confirmar (opcional)

3. **Notificaciones**
   - [ ] Notificación cliente: técnico asignado
   - [ ] Notificación coordinador: cliente no confirmó
   - [ ] Notificación coordinador: cliente confirmó
   - [ ] Notificación técnico: mantenimiento confirmado

4. **Lógica de Negocio**
   - [ ] Al asignar técnico → activar confirmación
   - [ ] Técnico no puede iniciar sin confirmación
   - [ ] Job verifica cada minuto

5. **Respuestas API**
   - [ ] Nuevos campos incluidos en respuestas

---

## 📞 Información de Contacto para Notificaciones

Cuando se notifique al coordinador, incluir:
- **Nombre del cliente**
- **Teléfono del cliente** (para poder llamar directamente)
- **ID del mantenimiento**
- **Fecha programada**
- **Turno**

Esto permite que el coordinador pueda llamar fácilmente desde la app.

---

## 🔍 Endpoints de Consulta Útiles

### **Para Cliente:**
- Ver mantenimientos pendientes de confirmar: Filtrar por `status=assigned` + `confirmation_required=true` + `confirmed_at=null`

### **Para Coordinador:**
- Ver mantenimientos sin confirmar que requieren llamada: Filtrar por `status=assigned` + `confirmation_required=true` + `confirmed_at=null` + `confirmation_deadline<=now` + `coordinator_notified=true`

---

## ⚠️ Consideraciones Importantes

1. **Tiempo de Confirmación:** El plazo es de 1 hora desde la asignación. Este tiempo puede ajustarse según necesidad.

2. **Estado del Mantenimiento:** El estado permanece como `assigned` durante todo el proceso de confirmación. Solo cambia cuando el técnico inicia.

3. **Múltiples Intentos:** El cliente puede confirmar en cualquier momento antes del deadline. Después del deadline, el coordinador es notificado.

4. **Notificaciones:** Usar Expo Push Notifications para enviar notificaciones push a los usuarios.

5. **Validaciones:** Siempre validar que:
   - Solo el cliente puede confirmar su propio mantenimiento
   - Solo el coordinador puede marcar como "llamado"
   - El técnico no puede iniciar sin confirmación

---

## 📱 Integración con Frontend

### **Campos que el Frontend debe recibir:**
```json
{
  "confirmation_required": true/false,
  "confirmed_at": "2025-01-15T10:30:00Z" o null,
  "confirmation_deadline": "2025-01-15T11:00:00Z" o null,
  "coordinator_notified": true/false,
  "coordinator_notified_at": "2025-01-15T11:05:00Z" o null,
  "coordinator_called": true/false,
  "coordinator_called_at": "2025-01-15T11:30:00Z" o null
}
```

### **El Frontend debe:**
- Mostrar botón de confirmación si `confirmation_required=true` y `confirmed_at=null`
- Mostrar estado "Pendiente de confirmación" si aplica
- Mostrar lista de mantenimientos sin confirmar para coordinador
- Permitir llamar al cliente desde la app (usando teléfono)

---

**Fecha de creación:** 2025-01-15  
**Última actualización:** 2025-01-15


