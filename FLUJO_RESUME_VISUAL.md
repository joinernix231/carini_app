# 🔄 Flujo Visual: Pausa y Reanudación de Mantenimientos

## 📊 Diagrama de Estados

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DEL MANTENIMIENTO              │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │  ASSIGNED   │  started_at: null
    │   (Nuevo)   │  
    └──────┬──────┘
           │
           │ 1. Técnico presiona "Iniciar Mantenimiento"
           │ 2. Va a IniciarMantenimiento (captura fotos)
           │ 3. POST /start (con GPS)
           ↓
    ┌─────────────┐
    │ IN_PROGRESS │  started_at: ✅
    │ (Trabajando)│  
    └──────┬──────┘
           │
           │ 4. Técnico presiona "Pausar"
           │ 5. Selecciona razón + GPS automático
           │ 6. POST /pause
           ↓
    ┌─────────────┐
    │  ASSIGNED   │  started_at: ✅ (conservado)
    │  (Pausado)  │  paused_at: ✅
    │             │  pause_reason: ✅
    └──────┬──────┘
           │
           │ 7. Técnico presiona "Reanudar" ✨
           │ 8. GPS automático
           │ 9. POST /resume ✨
           ↓
    ┌─────────────┐
    │ IN_PROGRESS │  resumed_at: ✅
    │(Reanudado) │  pause_duration: ✅
    └──────┬──────┘
           │
           │ 10. Técnico completa el trabajo
           │ 11. POST /complete
           ↓
    ┌─────────────┐
    │  COMPLETED  │  ended_at: ✅
    │  (Finalizado)│
    └─────────────┘
```

---

## 🎬 Secuencia de Pantallas

### **Escenario 1: Inicio Normal (Primera Vez)**

```
┌──────────────────┐
│  MisMantenimientos│
│                  │
│ [Mantenimiento]  │
│  Status: assigned│
│  started_at: ❌  │
│                  │
│ [Ver Detalle] →  │
└──────────────────┘
         │
         ↓
┌──────────────────┐
│DetalleMantenimiento│
│                  │
│ Cliente: ABC     │
│ Equipo: Lavadora │
│                  │
│ [📷 Iniciar]     │ ← Botón con icono de cámara
└──────────────────┘
         │
         ↓
┌──────────────────┐
│IniciarMantenimiento│
│                  │
│ [Foto Equipo 1]  │
│ [Foto Equipo 2]  │
│ [Foto Equipo 3]  │
│                  │
│ [Iniciar con GPS]│
└──────────────────┘
         │
         ↓ POST /start + GPS
         │
┌──────────────────┐
│MantenimientoEnProgreso│
│                  │
│ ⏱️ 00:00:00      │
│ 📍 GPS guardado  │
│                  │
│ [⏸️ Pausar]      │
│ [✅ Finalizar]   │
└──────────────────┘
```

---

### **Escenario 2: Pausa del Trabajo**

```
┌──────────────────┐
│MantenimientoEnProgreso│
│                  │
│ ⏱️ 01:23:45      │ ← Llevaba 1h 23min trabajando
│                  │
│ Técnico presiona │
│ [⏸️ Pausar]      │
└──────────────────┘
         │
         ↓
┌──────────────────┐
│ PauseReasonModal │
│                  │
│ Razones Rápidas: │
│ [🍽️ Almuerzo]    │
│ [☕ Descanso]    │
│ [⚠️ Emergencia]  │
│ [🔧 Repuesto]    │
│ [💬 Otro]        │
│                  │
│ [Pausar Ahora]   │
└──────────────────┘
         │
         ↓ POST /pause + GPS + razón
         │
┌──────────────────┐
│  TecnicoDashboard│
│                  │
│ Mantenimiento    │
│ pausado          │
│ exitosamente ✅  │
└──────────────────┘
```

---

### **Escenario 3: Reanudación del Trabajo** ✨

```
┌──────────────────┐
│  MisMantenimientos│
│                  │
│ [Mantenimiento]  │
│  Status: assigned│ ← Pausado
│  started_at: ✅  │ ← Tiene started_at
│                  │
│ [Continuar] →    │
└──────────────────┘
         │
         ↓
┌──────────────────┐
│DetalleMantenimiento│
│                  │
│ Cliente: ABC     │
│ Equipo: Lavadora │
│ Pausado por:     │
│ "Almuerzo" 🍽️    │
│                  │
│ [▶️ Reanudar]    │ ← Botón con play icon
└──────────────────┘
         │
         ↓ Usuario presiona
         │
┌──────────────────┐
│DetalleMantenimiento│
│                  │
│ [🔄 Cargando...] │ ← Spinner mientras resume
│                  │
│ GPS automático → │
│ POST /resume     │
└──────────────────┘
         │
         ↓ Success
         │
┌──────────────────┐
│MantenimientoEnProgreso│
│                  │
│ ⏱️ 01:23:45      │ ← Timer continúa
│ 📍 GPS actualizado│
│                  │
│ [⏸️ Pausar]      │
│ [✅ Finalizar]   │
└──────────────────┘
```

---

## 🔀 Lógica del Botón Inteligente

### **`DetalleMantenimiento.tsx`**

```
┌─────────────────────────────────────────────────┐
│           LÓGICA DEL BOTÓN DINÁMICO             │
└─────────────────────────────────────────────────┘

    ┌────────────────────────────┐
    │ maintenance.started_at ?   │
    └───────────┬────────────────┘
                │
        ┌───────┴────────┐
        │                │
       SÍ               NO
        │                │
        ↓                ↓
┌───────────────┐  ┌──────────────────┐
│   REANUDAR    │  │     INICIAR      │
├───────────────┤  ├──────────────────┤
│ Icono: ▶️     │  │ Icono: 📷        │
│ Texto:        │  │ Texto:           │
│ "Reanudar     │  │ "Iniciar         │
│ Mantenimiento"│  │ Mantenimiento"   │
│               │  │                  │
│ Acción:       │  │ Acción:          │
│ 1. GPS auto   │  │ 1. Navega a      │
│ 2. POST       │  │ IniciarMant.     │
│    /resume    │  │ 2. Captura fotos │
│ 3. Navega a   │  │ 3. POST /start   │
│    Progreso   │  │ 4. Navega a      │
│               │  │    Progreso      │
└───────────────┘  └──────────────────┘
```

---

## 📦 Estructura del Hook

### **`useMaintenanceActions`**

```
┌────────────────────────────────────────────────┐
│           useMaintenanceActions()              │
├────────────────────────────────────────────────┤
│                                                │
│  Estados:                                      │
│  ├─ starting: boolean                          │
│  ├─ pausing: boolean                           │
│  └─ resuming: boolean                          │
│                                                │
│  Funciones:                                    │
│  ├─ startMaintenance(id)                       │
│  │   ├─ Pedir permisos GPS                     │
│  │   ├─ Obtener ubicación                      │
│  │   ├─ POST /start                            │
│  │   └─ return success                         │
│  │                                              │
│  ├─ pauseMaintenance(id, reason)               │
│  │   ├─ Pedir permisos GPS                     │
│  │   ├─ Obtener ubicación                      │
│  │   ├─ POST /pause                            │
│  │   └─ return success                         │
│  │                                              │
│  └─ resumeMaintenance(id) ✨                   │
│      ├─ Pedir permisos GPS                     │
│      ├─ Obtener ubicación                      │
│      ├─ POST /resume                           │
│      └─ return success                         │
│                                                │
│  Manejo Automático:                            │
│  ├─ Permisos GPS                               │
│  ├─ Alertas de error                           │
│  ├─ Logging de debug                           │
│  └─ Estados de carga                           │
└────────────────────────────────────────────────┘
```

---

## 🎨 Estados Visuales del Botón

### **En `DetalleMantenimiento`**

**Estado 1: Inicial (Sin Iniciar)**
```
┌─────────────────────────────┐
│                             │
│  📷  Iniciar Mantenimiento  │
│                             │
└─────────────────────────────┘
  Color: Azul (#007AFF)
  Enabled: ✅
```

**Estado 2: Pausado (Con started_at)**
```
┌─────────────────────────────┐
│                             │
│  ▶️  Reanudar Mantenimiento │
│                             │
└─────────────────────────────┘
  Color: Azul (#007AFF)
  Enabled: ✅
```

**Estado 3: Reanudando (Loading)**
```
┌─────────────────────────────┐
│                             │
│  🔄  Cargando...            │
│                             │
└─────────────────────────────┘
  Color: Gris (#C7C7CC)
  Enabled: ❌
  Opacity: 0.6
```

---

## 🗂️ Estructura de Datos

### **Maintenance Object (Frontend)**

```typescript
interface TecnicoMaintenance {
  id: number;
  status: 'assigned' | 'in_progress' | 'completed';
  started_at?: string;    // ✅ Key para detectar pausa
  paused_at?: string;     // Timestamp última pausa
  resumed_at?: string;    // Timestamp última reanudación
  pause_reason?: string;  // Razón de la pausa
  pause_duration?: string;// Duración total pausado
  // ... otros campos
}
```

**Detección de Estado:**
```typescript
// ¿Es primera vez?
!maintenance.started_at
→ Mostrar "Iniciar Mantenimiento"
→ Ir a capturar fotos

// ¿Está pausado?
maintenance.started_at && maintenance.status === 'assigned'
→ Mostrar "Reanudar Mantenimiento"
→ Llamar resume() + navegar

// ¿Está en progreso?
maintenance.status === 'in_progress'
→ Mostrar "Continuar Trabajo"
→ Navegar directo a progreso
```

---

## 🌐 Comunicación Backend-Frontend

### **Endpoint Resume Flow**

```
FRONTEND                          BACKEND
   │                                │
   │  1. Usuario presiona "Reanudar"│
   │                                │
   ↓                                │
useMaintenanceActions.resumeMaintenance(id)
   │                                │
   ↓                                │
getLocation() → GPS permisos        │
   │                                │
   ↓                                │
Location.getCurrentPositionAsync()  │
   │                                │
   ↓                                │
{ lat: 4.613, lon: -74.193 }        │
   │                                │
   ↓                                │
POST /api/technicianMaintenances/   │
     {maintenance}/resume           │
   │                                │
   │  Body: { latitude, longitude } │
   ├────────────────────────────────→
   │                                │
   │                            Validar:
   │                            - status === 'assigned'
   │                            - started_at !== null
   │                                │
   │                            Calcular:
   │                            - pause_duration
   │                                │
   │                            Actualizar:
   │                            - resumed_at = now
   │                            - status = 'in_progress'
   │                                │
   │                            Registrar:
   │                            - location_log (resume)
   │                                │
   │                                ↓
   ←────────────────────────────────┤
   │  Response: { success: true }   │
   │                                │
   ↓                                │
if (success) {                      │
  navigate('MantenimientoEnProgreso')
}
```

---

## 🔐 Permisos y Seguridad

### **Flujo de Permisos GPS**

```
┌────────────────────────────────────────┐
│     Solicitud de Permisos GPS          │
└────────────────────────────────────────┘

    resumeMaintenance(id)
            │
            ↓
    ┌─────────────┐
    │ Permisos    │
    │ otorgados?  │
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │             │
   SÍ            NO
    │             │
    ↓             ↓
Obtener        Solicitar
ubicación      permisos
    │             │
    │        ┌────┴────┐
    │        │         │
    │   Otorga    Deniega
    │        │         │
    │        ↓         ↓
    │    Obtener    Alert
    │    ubicación  "Permisos
    │        │      necesarios"
    │        │         │
    └────────┴────→    │
             │         │
             ↓         ↓
         POST      Return
         /resume   false
             │
             ↓
         Success
```

---

## 📊 Comparación: Antes vs Después

### **Antes de `useMaintenanceActions`**

```
DetalleMantenimiento.tsx (60 líneas)
├─ Pedir permisos GPS
├─ Obtener ubicación
├─ Manejar errores GPS
├─ Llamar servicio
├─ Manejar errores API
└─ Navegar

MantenimientoEnProgreso.tsx (60 líneas)
├─ Pedir permisos GPS
├─ Obtener ubicación
├─ Manejar errores GPS
├─ Llamar servicio
├─ Manejar errores API
└─ Navegar

IniciarMantenimiento.tsx (60 líneas)
├─ Pedir permisos GPS
├─ Obtener ubicación
├─ Manejar errores GPS
├─ Llamar servicio
├─ Manejar errores API
└─ Navegar

TOTAL: 180 líneas duplicadas ❌
```

### **Después de `useMaintenanceActions`**

```
useMaintenanceActions.ts (200 líneas)
├─ getLocation() → Maneja GPS
├─ startMaintenance()
├─ pauseMaintenance()
└─ resumeMaintenance()

DetalleMantenimiento.tsx (10 líneas)
const { resuming, resumeMaintenance } = useMaintenanceActions();
await resumeMaintenance(id);

MantenimientoEnProgreso.tsx (10 líneas)
const { pausing, pauseMaintenance } = useMaintenanceActions();
await pauseMaintenance(id, reason);

IniciarMantenimiento.tsx (10 líneas)
const { starting, startMaintenance } = useMaintenanceActions();
await startMaintenance(id);

TOTAL: 30 líneas en pantallas ✅
       200 líneas centralizadas ✅
```

**Resultado:** 
- **83% menos código duplicado**
- **Mantenibilidad mejorada**
- **Testing más fácil**

---

## ✅ **Resumen Visual**

```
┌─────────────────────────────────────────────────┐
│          FLUJO COMPLETO RESUME                  │
└─────────────────────────────────────────────────┘

1. INICIO
   Usuario ve mantenimiento pausado
   │
   ↓
2. DETECCIÓN
   Pantalla detecta started_at ✅
   Muestra "Reanudar Mantenimiento"
   │
   ↓
3. ACCIÓN
   Usuario presiona botón
   │
   ↓
4. HOOK
   useMaintenanceActions.resumeMaintenance()
   │
   ├─ Obtiene GPS automáticamente
   ├─ Llama POST /resume
   └─ Maneja errores
   │
   ↓
5. BACKEND
   ├─ Calcula pause_duration
   ├─ Actualiza resumed_at
   ├─ Cambia status → in_progress
   └─ Registra ubicación
   │
   ↓
6. NAVEGACIÓN
   if (success) → MantenimientoEnProgreso
   │
   ↓
7. TRABAJO
   Timer continúa, técnico sigue trabajando

✅ FLUJO COMPLETADO
```

---

**¡Visualización completa del flujo de reanudación!** 🎨✨

**Fecha:** 29 de Octubre, 2025  
**Versión:** 1.0.0


