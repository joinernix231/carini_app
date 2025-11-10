# 📱 Documentación: Notificaciones de Comunicación entre Roles

## 🎯 Objetivo
Implementar un sistema de notificaciones push para mantener una comunicación fluida entre técnicos, coordinadores y clientes durante todo el proceso de mantenimiento.

---

## 📋 Notificaciones a Implementar

### **1. maintenance_started - Técnico → Coordinador y Cliente**

**¿Cuándo se envía?**
- Cuando el técnico inicia un mantenimiento (presiona el botón "Iniciar Mantenimiento")

**¿A quién se envía?**
- Al coordinador que asignó el mantenimiento
- Al cliente dueño del mantenimiento
- Opcionalmente: al administrador

**¿Qué información debe contener?**
- ID del mantenimiento
- Nombre del técnico
- Nombre del cliente
- Fecha y hora de inicio
- Ubicación GPS del técnico (opcional)

**Mensaje sugerido para Coordinador:**
```
Título: "🔧 Mantenimiento Iniciado"
Cuerpo: "El técnico {nombre_tecnico} inició el mantenimiento #{id} del cliente {nombre_cliente}"
```

**Mensaje sugerido para Cliente:**
```
Título: "🔧 Mantenimiento en Progreso"
Cuerpo: "El técnico {nombre_tecnico} inició el mantenimiento de tu equipo. Está trabajando ahora"
```

**¿Qué debe hacer el backend?**
1. Detectar cuando el técnico inicia el mantenimiento (endpoint: `POST /api/technicianMaintenances/{id}/start`)
2. Buscar el coordinador que asignó este mantenimiento
3. Buscar el cliente dueño del mantenimiento
4. Obtener los tokens de notificación del coordinador y del cliente
5. Enviar notificación push al coordinador con los datos del mantenimiento
6. Enviar notificación push al cliente con los datos del mantenimiento
7. Guardar registro de las notificaciones en la base de datos (opcional)

**Datos adicionales para el frontend (Coordinador):**
```json
{
  "type": "maintenance_started",
  "maintenance_id": 123,
  "technician_id": 5,
  "technician_name": "Carlos Técnico",
  "client_id": 1,
  "client_name": "Juan Pérez",
  "started_at": "2025-01-15T10:30:00Z",
  "screen": "DetalleMantenimiento"
}
```

**Datos adicionales para el frontend (Cliente):**
```json
{
  "type": "maintenance_started",
  "maintenance_id": 123,
  "technician_id": 5,
  "technician_name": "Carlos Técnico",
  "started_at": "2025-01-15T10:30:00Z",
  "screen": "DetalleMantenimiento"
}
```

**Nota:** Esta notificación se envía tanto al coordinador como al cliente al mismo tiempo, pero con mensajes diferentes según el destinatario.

---

### **2. maintenance_completed - Técnico → Coordinador**

**¿Cuándo se envía?**
- Cuando el técnico completa un mantenimiento (presiona el botón "Finalizar Mantenimiento" y sube todas las fotos y la firma)

**¿A quién se envía?**
- Al coordinador que asignó el mantenimiento
- Opcionalmente: al administrador

**¿Qué información debe contener?**
- ID del mantenimiento
- Nombre del técnico
- Nombre del cliente
- Fecha y hora de finalización
- Tiempo total de trabajo
- Estado del mantenimiento (completado)

**Mensaje sugerido:**
```
Título: "✅ Mantenimiento Completado"
Cuerpo: "El técnico {nombre_tecnico} completó el mantenimiento #{id} del cliente {nombre_cliente}"
```

**¿Qué debe hacer el backend?**
1. Detectar cuando el técnico completa el mantenimiento (endpoint: `POST /api/technicianMaintenances/{id}/complete`)
2. Buscar el coordinador que asignó este mantenimiento
3. Obtener el token de notificación del coordinador
4. Enviar notificación push con los datos del mantenimiento
5. Guardar registro de la notificación en la base de datos (opcional)

**Datos adicionales para el frontend:**
```json
{
  "type": "maintenance_completed",
  "maintenance_id": 123,
  "technician_id": 5,
  "technician_name": "Carlos Técnico",
  "client_id": 1,
  "client_name": "Juan Pérez",
  "completed_at": "2025-01-15T14:30:00Z",
  "total_work_time": "4 horas 30 minutos",
  "screen": "DetalleMantenimiento"
}
```

---

### **3. maintenance_paused - Técnico → Coordinador**

**¿Cuándo se envía?**
- Cuando el técnico pausa un mantenimiento en progreso (presiona el botón "Pausar")

**¿A quién se envía?**
- Al coordinador que asignó el mantenimiento

**¿Qué información debe contener?**
- ID del mantenimiento
- Nombre del técnico
- Nombre del cliente
- Fecha y hora de pausa
- Motivo de la pausa (si el técnico lo especifica)

**Mensaje sugerido:**
```
Título: "⏸️ Mantenimiento Pausado"
Cuerpo: "El técnico {nombre_tecnico} pausó el mantenimiento #{id}. Motivo: {motivo}"
```

**¿Qué debe hacer el backend?**
1. Detectar cuando el técnico pausa el mantenimiento (endpoint: `POST /api/technicianMaintenances/{id}/pause`)
2. Buscar el coordinador que asignó este mantenimiento
3. Obtener el token de notificación del coordinador
4. Enviar notificación push con los datos del mantenimiento y el motivo
5. Guardar registro de la notificación en la base de datos (opcional)

**Datos adicionales para el frontend:**
```json
{
  "type": "maintenance_paused",
  "maintenance_id": 123,
  "technician_id": 5,
  "technician_name": "Carlos Técnico",
  "client_id": 1,
  "client_name": "Juan Pérez",
  "paused_at": "2025-01-15T12:00:00Z",
  "pause_reason": "Almuerzo",
  "screen": "DetalleMantenimiento"
}
```

---

### **4. maintenance_finished - Técnico → Cliente**

**¿Cuándo se envía?**
- Cuando el técnico completa un mantenimiento (mismo momento que `maintenance_completed`)

**¿A quién se envía?**
- Al cliente dueño del mantenimiento

**¿Qué información debe contener?**
- ID del mantenimiento
- Nombre del técnico
- Fecha y hora de finalización
- Estado del mantenimiento (completado)

**Mensaje sugerido:**
```
Título: "✅ Mantenimiento Finalizado"
Cuerpo: "El técnico {nombre_tecnico} completó tu mantenimiento #{id}. Revisa los detalles y firma"
```

**¿Qué debe hacer el backend?**
1. Detectar cuando el técnico completa el mantenimiento (endpoint: `POST /api/technicianMaintenances/{id}/complete`)
2. Buscar el cliente dueño del mantenimiento
3. Obtener el token de notificación del cliente
4. Enviar notificación push con los datos del mantenimiento
5. Guardar registro de la notificación en la base de datos (opcional)

**Datos adicionales para el frontend:**
```json
{
  "type": "maintenance_finished",
  "maintenance_id": 123,
  "technician_id": 5,
  "technician_name": "Carlos Técnico",
  "completed_at": "2025-01-15T14:30:00Z",
  "screen": "DetalleMantenimiento"
}
```

**Nota:** Esta notificación se envía al mismo tiempo que `maintenance_completed`, pero a diferentes destinatarios.

---

### **5. quotation_sent - Coordinador → Cliente**

**¿Cuándo se envía?**
- Cuando el coordinador envía una cotización al cliente (después de crear o actualizar una cotización)

**¿A quién se envía?**
- Al cliente dueño del mantenimiento

**¿Qué información debe contener?**
- ID del mantenimiento
- ID de la cotización
- Monto de la cotización
- Fecha de vencimiento (si aplica)

**Mensaje sugerido:**
```
Título: "💰 Cotización Enviada"
Cuerpo: "Se envió una cotización de ${monto} para el mantenimiento #{id}. Revisa y aprueba"
```

**¿Qué debe hacer el backend?**
1. Detectar cuando el coordinador crea o envía una cotización (endpoint: `POST /api/maintenances/{id}/quotation` o similar)
2. Buscar el cliente dueño del mantenimiento
3. Obtener el token de notificación del cliente
4. Enviar notificación push con los datos de la cotización
5. Guardar registro de la notificación en la base de datos (opcional)

**Datos adicionales para el frontend:**
```json
{
  "type": "quotation_sent",
  "maintenance_id": 123,
  "quotation_id": 45,
  "amount": 500000,
  "currency": "COP",
  "expires_at": "2025-01-20T23:59:59Z",
  "screen": "DetalleMantenimiento"
}
```

---

### **6. quotation_approved - Cliente → Coordinador**

**¿Cuándo se envía?**
- Cuando el cliente aprueba una cotización (presiona el botón "Aprobar Cotización")

**¿A quién se envía?**
- Al coordinador que envió la cotización
- Opcionalmente: al administrador

**¿Qué información debe contener?**
- ID del mantenimiento
- ID de la cotización
- Nombre del cliente
- Monto aprobado
- Fecha de aprobación

**Mensaje sugerido:**
```
Título: "✅ Cotización Aprobada"
Cuerpo: "El cliente {nombre_cliente} aprobó la cotización de ${monto} para el mantenimiento #{id}"
```

**¿Qué debe hacer el backend?**
1. Detectar cuando el cliente aprueba la cotización (endpoint: `POST /api/maintenances/{id}/quotation/approve` o similar)
2. Buscar el coordinador que envió la cotización
3. Obtener el token de notificación del coordinador
4. Enviar notificación push con los datos de la aprobación
5. Guardar registro de la notificación en la base de datos (opcional)

**Datos adicionales para el frontend:**
```json
{
  "type": "quotation_approved",
  "maintenance_id": 123,
  "quotation_id": 45,
  "client_id": 1,
  "client_name": "Juan Pérez",
  "amount": 500000,
  "approved_at": "2025-01-15T16:00:00Z",
  "screen": "DetalleMantenimiento"
}
```

---

### **7. payment_uploaded - Cliente → Coordinador**

**¿Cuándo se envía?**
- Cuando el cliente sube un comprobante de pago (imagen o PDF del comprobante)

**¿A quién se envía?**
- Al coordinador que gestiona el mantenimiento
- Opcionalmente: al administrador

**¿Qué información debe contener?**
- ID del mantenimiento
- Nombre del cliente
- Monto del pago
- Fecha de subida del comprobante

**Mensaje sugerido:**
```
Título: "💳 Comprobante de Pago Subido"
Cuerpo: "El cliente {nombre_cliente} subió el comprobante de pago para el mantenimiento #{id}"
```

**¿Qué debe hacer el backend?**
1. Detectar cuando el cliente sube un comprobante de pago (endpoint: `POST /api/maintenances/{id}/payment` o similar)
2. Buscar el coordinador que gestiona este mantenimiento
3. Obtener el token de notificación del coordinador
4. Enviar notificación push con los datos del pago
5. Guardar registro de la notificación en la base de datos (opcional)

**Datos adicionales para el frontend:**
```json
{
  "type": "payment_uploaded",
  "maintenance_id": 123,
  "client_id": 1,
  "client_name": "Juan Pérez",
  "payment_amount": 500000,
  "payment_support_url": "https://...",
  "uploaded_at": "2025-01-15T17:00:00Z",
  "screen": "DetalleMantenimiento"
}
```

---

## 🔄 Resumen de Flujos

### **Flujo 1: Técnico Inicia Mantenimiento**
```
1. Técnico presiona "Iniciar Mantenimiento"
   ↓
2. Backend actualiza estado a "in_progress"
   ↓
3. Backend envía 2 notificaciones "maintenance_started":
   - → Coordinador (con mensaje para coordinador)
   - → Cliente (con mensaje para cliente)
```

### **Flujo 2: Técnico Pausa Mantenimiento**
```
1. Técnico presiona "Pausar"
   ↓
2. Backend registra pausa
   ↓
3. Backend envía notificación "maintenance_paused" → Coordinador
```

### **Flujo 3: Técnico Completa Mantenimiento**
```
1. Técnico presiona "Finalizar Mantenimiento" y sube fotos/firma
   ↓
2. Backend actualiza estado a "completed"
   ↓
3. Backend envía 2 notificaciones:
   - "maintenance_completed" → Coordinador
   - "maintenance_finished" → Cliente
```

### **Flujo 4: Coordinador Envía Cotización**
```
1. Coordinador crea/envía cotización
   ↓
2. Backend guarda cotización
   ↓
3. Backend envía notificación "quotation_sent" → Cliente
```

### **Flujo 5: Cliente Aprueba Cotización**
```
1. Cliente presiona "Aprobar Cotización"
   ↓
2. Backend actualiza estado de cotización a "approved"
   ↓
3. Backend envía notificación "quotation_approved" → Coordinador
```

### **Flujo 6: Cliente Sube Comprobante de Pago**
```
1. Cliente sube imagen/PDF del comprobante
   ↓
2. Backend guarda archivo y registra pago
   ↓
3. Backend envía notificación "payment_uploaded" → Coordinador
```

---

## 📊 Tabla Resumen

| Notificación | De | Para | Cuándo | Prioridad |
|-------------|-----|------|--------|-----------|
| `maintenance_started` | Técnico | Coordinador + Cliente | Técnico inicia mantenimiento | Alta |
| `maintenance_completed` | Técnico | Coordinador | Técnico completa mantenimiento | Alta |
| `maintenance_paused` | Técnico | Coordinador | Técnico pausa mantenimiento | Media |
| `maintenance_finished` | Técnico | Cliente | Técnico completa mantenimiento | Alta |
| `quotation_sent` | Coordinador | Cliente | Coordinador envía cotización | Alta |
| `quotation_approved` | Cliente | Coordinador | Cliente aprueba cotización | Alta |
| `payment_uploaded` | Cliente | Coordinador | Cliente sube comprobante | Alta |

---

## 🔧 Consideraciones Técnicas (Opcional)

### **Estructura de Datos de Notificación**
Cada notificación debe incluir:
- `type`: Tipo de notificación (ej: "maintenance_started")
- `maintenance_id`: ID del mantenimiento relacionado
- `screen`: Pantalla a la que debe navegar el frontend (ej: "DetalleMantenimiento")
- Datos adicionales según el tipo de notificación

### **Tokens de Notificación**
- Cada usuario debe tener un token de notificación registrado en la tabla `notification_tokens`
- El token se obtiene del dispositivo móvil cuando el usuario inicia sesión
- Se debe validar que el usuario tenga un token antes de enviar la notificación

### **Manejo de Errores**
- Si falla el envío de notificación, no debe afectar la operación principal (ej: si falla la notificación, el mantenimiento igual se debe completar)
- Registrar errores en logs para debugging
- Opcional: Reintentar envío de notificaciones fallidas

### **Notificaciones Múltiples**
- Algunas acciones pueden generar múltiples notificaciones (ej: cuando el técnico completa, se notifica al coordinador Y al cliente)
- Asegurarse de enviar todas las notificaciones necesarias

---

## ✅ Checklist de Implementación

### **Backend debe:**
- [ ] Detectar cuando el técnico inicia un mantenimiento
- [ ] Detectar cuando el técnico pausa un mantenimiento
- [ ] Detectar cuando el técnico completa un mantenimiento
- [ ] Detectar cuando el coordinador envía una cotización
- [ ] Detectar cuando el cliente aprueba una cotización
- [ ] Detectar cuando el cliente sube un comprobante de pago
- [ ] Obtener tokens de notificación de los usuarios destinatarios
- [ ] Enviar notificaciones push con los datos correctos
- [ ] Manejar errores sin afectar las operaciones principales

### **Frontend ya tiene:**
- ✅ Servicio de notificaciones configurado
- ✅ Handlers para recibir notificaciones
- ✅ Navegación automática según tipo de notificación
- ✅ Pantallas de detalle de mantenimiento para todos los roles

---

## 📞 Soporte

Si tienes dudas sobre la implementación o necesitas más detalles sobre algún flujo, contacta al equipo de frontend.

---

**Última actualización:** 2025-01-15

