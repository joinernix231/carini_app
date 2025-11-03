# 📋 COTIZACIÓN - FUNCIONALIDADES ADICIONALES
## Aplicación Móvil Carini

**Cliente:** CARINI SAS  
**NIT:** 900.635.489-8  
**Fecha:** [Fecha actual]  
**Proyecto:** Aplicación Móvil de Mantenimiento Industrial

---

## 📄 RESUMEN DEL CONTRATO ORIGINAL

**Contrato No:** [Número del contrato si aplica]  
**Fecha de Contrato:** 11 de Junio, 2025  
**Valor Contrato Original:** $7.050.000 COP  
**Alcance Original:**
- App móvil con 3 roles básicos (Cliente, Técnico, Coordinador)
- Funcionalidades básicas de visualización y actualización de estado
- Backend Laravel + APIs
- Sitio Web Corporativo (pendiente)

**Estado de Pago:**
- ✅ Pagado: $3.525.000 (50%)
- ⏳ Pendiente: $3.525.000 (50%)

---

## 🆕 FUNCIONALIDADES ADICIONALES IMPLEMENTADAS

Durante el desarrollo del proyecto, se identificaron y se implementaron funcionalidades adicionales que mejoran significativamente la experiencia de usuario y la eficiencia del sistema. Estas funcionalidades **NO estaban contempladas en el contrato original** y representan un valor agregado considerable.

### DESGLOSE DETALLADO

| # | Funcionalidad | Descripción Técnica | Complejidad | Horas Est. | Valor COP |
|---|---------------|---------------------|------------|------------|-----------|
| **1** | **Sistema de Notificaciones Push Completo** | | | | **$1.500.000** |
| | - Servicio PushNotificationService | Integración con Expo Push Notifications, gestión de tokens, registro/desregistro | Alta | 20h | $600.000 |
| | - Hook usePushNotifications | Hook personalizado para manejo de estado de notificaciones, contador de no leídas | Media | 12h | $400.000 |
| | - Componente NotificationBanner | Banner de notificaciones en tiempo real, integración en App.tsx | Media | 10h | $300.000 |
| | - Pantalla de pruebas NotificationsScreen | Pantalla de testing y gestión de notificaciones | Baja | 8h | $200.000 |
| **2** | **Rol Administrador Completo (4to Rol)** | | | | **$2.800.000** |
| | - Dashboard Administrador | Dashboard con estadísticas y resumen ejecutivo | Media | 15h | $600.000 |
| | - CRUD Clientes (4 pantallas) | Crear, Listar, Editar, Detalle completo con validaciones | Alta | 25h | $800.000 |
| | - CRUD Técnicos (4 pantallas) | Gestión completa de técnicos con validaciones | Alta | 25h | $800.000 |
| | - CRUD Coordinadores (4 pantallas) | Gestión completa de coordinadores | Alta | 20h | $600.000 |
| | - CRUD Equipos Administrador | Gestión de catálogo de equipos desde admin | Media | 15h | $500.000 |
| **3** | **Sistema de Mantenimientos Multi-Equipo** | | | | **$1.400.000** |
| | - Componente MultiDeviceSelector | Selector múltiple avanzado con búsqueda en tiempo real | Alta | 18h | $600.000 |
| | - Lógica de checklist inteligente | Checklist adaptativo según tipo de equipos seleccionados | Media | 12h | $400.000 |
| | - Validaciones complejas multi-equipo | Validación de selección múltiple, descripciones por equipo | Media | 10h | $300.000 |
| | - Compatibilidad bidireccional | Soporte para flujo original (1 equipo) y nuevo (múltiples) | Media | 10h | $300.000 |
| **4** | **Flujo Técnico Avanzado con Timer y GPS** | | | | **$3.200.000** |
| | - Sistema de Timer con pausa/reanudación | Timer en tiempo real, cálculo de pausas, persistencia | Alta | 25h | $900.000 |
| | - Integración GPS (inicio, pausa, reanudación) | Captura de ubicación en todos los estados críticos | Alta | 20h | $700.000 |
| | - Sistema de checklist por tipo de equipo | Checklists dinámicos (lavadora 9 items, secadora 7 items) | Media | 15h | $500.000 |
| | - Guardado automático de progreso | Auto-save del checklist, sincronización con backend | Media | 12h | $400.000 |
| | - Hook useMaintenanceActions | Hook centralizado para acciones (start, pause, resume) | Alta | 15h | $500.000 |
| | - Hook useMaintenanceTimer | Hook especializado para manejo de tiempo | Media | 10h | $300.000 |
| | - Navegación inteligente con redirección | Auto-redirect a mantenimiento activo al iniciar app | Media | 8h | $200.000 |
| **5** | **Sistema de Captura y Gestión de Fotos** | | | | **$900.000** |
| | - Captura de fotos iniciales obligatorias | Sistema de fotos por equipo al iniciar mantenimiento | Media | 15h | $500.000 |
| | - Upload a S3 con optimización | Subida de imágenes a S3, redimensionamiento, validación | Alta | 12h | $400.000 |
| | - Integración expo-image-picker | Integración nativa con permisos de cámara y galería | Baja | 8h | $200.000 |
| **6** | **Funcionalidades Adicionales del Técnico** | | | | **$1.000.000** |
| | - Mi Carnet Digital | Carnet digital del técnico con información personalizada | Media | 12h | $400.000 |
| | - Módulo Parafiscales | Gestión de EPS, ARL, Pensión del técnico | Media | 15h | $500.000 |
| | - GestionarDocumentos | Sistema de gestión y visualización de documentos técnicos | Media | 10h | $300.000 |
| | - Perfil técnico extendido | Perfil completo con información adicional | Baja | 8h | $200.000 |
| **7** | **Sistema de Gestión de Documentos** | | | | **$700.000** |
| | - Upload de documentos | Sistema de subida de archivos (PDF, imágenes, etc.) | Media | 12h | $400.000 |
| | - Visualización de PDFs con WebView | Integración de visor de PDFs en la app | Media | 10h | $300.000 |
| | - Gestión de documentos por rol | Permisos y acceso a documentos según rol | Baja | 8h | $200.000 |
| **8** | **Sistema de Hooks Personalizados Avanzados** | | | | **$1.200.000** |
| | - 33 hooks personalizados | Hooks especializados para diferentes funcionalidades | Alta | 30h | $1.000.000 |
| | - Optimización de queries y caché | Sistema de caché inteligente, optimización de llamadas API | Alta | 12h | $400.000 |
| | - Manejo de estados complejos | Gestión avanzada de estados con useReducer, contextos | Media | 8h | $300.000 |
| **9** | **Mejoras de UI/UX Avanzadas** | | | | **$900.000** |
| | - Componentes reutilizables avanzados | Componentes modulares y reutilizables (MaintenanceCard, etc.) | Media | 15h | $500.000 |
| | - Animaciones y transiciones suaves | Animaciones fluidas, transiciones entre pantallas | Media | 10h | $300.000 |
| | - Diseño responsive y moderno | UI moderna con gradients, iconografía consistente | Baja | 8h | $200.000 |
| | - Sistema de loading optimizado | Loading states, skeletons, feedback visual | Baja | 8h | $200.000 |
| **10** | **Sistema de Filtros y Búsqueda Avanzada** | | | | **$600.000** |
| | - Filtros por estado, fecha, tipo | Sistema de filtrado multi-criterio | Media | 12h | $400.000 |
| | - Búsqueda en tiempo real | Búsqueda instantánea con debounce | Media | 10h | $300.000 |
| | - Paginación inteligente | Paginación optimizada con lazy loading | Baja | 8h | $200.000 |
| **11** | **Flujo de Coordinador Avanzado** | | | | **$800.000** |
| | - Múltiples vistas de mantenimientos | MantenimientosSinAsignar, SinCotizacion, Aprobados, etc. | Alta | 18h | $600.000 |
| | - Sistema de asignación avanzado | Asignación con validaciones y feedback | Media | 12h | $400.000 |
| | - Gestión de cotizaciones | Vista y gestión de cotizaciones pendientes | Media | 10h | $300.000 |
| **12** | **Sistema de Políticas y Términos** | | | | **$300.000** |
| | - Pantalla AcceptPolicyScreen | Sistema de aceptación de políticas al iniciar | Baja | 8h | $200.000 |
| | - Validación de aceptación | Control de acceso basado en aceptación | Baja | 6h | $150.000 |
| **13** | **Optimizaciones y Arquitectura** | | | | **$700.000** |
| | - Lazy loading de pantallas | Carga diferida de pantallas pesadas | Media | 10h | $300.000 |
| | - Sistema de navegación inteligente | RoleBasedNavigator con lógica avanzada | Alta | 12h | $400.000 |
| | - BaseService reutilizable | Servicio base para todas las APIs, DRY principle | Media | 8h | $200.000 |

---

## 💰 RESUMEN FINANCIERO

### **Funcionalidades Adicionales:**

| Categoría | Valor |
|-----------|-------|
| Notificaciones Push | $1.500.000 |
| Rol Administrador | $2.800.000 |
| Mantenimientos Multi-Equipo | $1.400.000 |
| Flujo Técnico Avanzado | $3.200.000 |
| Sistema de Fotos | $900.000 |
| Funcionalidades Técnico | $1.000.000 |
| Gestión de Documentos | $700.000 |
| Hooks Personalizados | $1.200.000 |
| Mejoras UI/UX | $900.000 |
| Filtros y Búsqueda | $600.000 |
| Flujo Coordinador Avanzado | $800.000 |
| Políticas y Términos | $300.000 |
| Optimizaciones | $700.000 |

**SUBTOTAL FUNCIONALIDADES ADICIONALES:** **$15.800.000 COP**

---

### **Completamiento del Contrato Original:**

| Concepto | Valor |
|----------|-------|
| Pantallas de Finalización (firma, fotos finales) | $2.500.000 |
| 50% Restante del Contrato Original | $3.525.000 |

**SUBTOTAL COMPLETAMIENTO:** **$6.025.000 COP**

---

## 📊 TOTALES

| Concepto | Valor |
|----------|-------|
| Funcionalidades Adicionales | $15.800.000 |
| Completamiento Contrato Original | $6.025.000 |
| **TOTAL TÉCNICO** | **$21.825.000** |

---

## 🎯 PROPUESTA COMERCIAL

Considerando la relación comercial establecida y el valor agregado entregado, se propone el siguiente arreglo:

### **Opción 1: Propuesta Estándar (Recomendada)**

| Concepto | Valor |
|----------|-------|
| Completamiento Contrato Original | $6.025.000 |
| Reconocimiento Trabajo Adicional (30% descuento) | $4.740.000 |
| **TOTAL PROPUESTA** | **$10.765.000 COP** |

### **Opción 2: Propuesta Negociable**

| Concepto | Valor |
|----------|-------|
| Completamiento Contrato Original | $6.025.000 |
| Reconocimiento Trabajo Adicional (50% descuento) | $3.950.000 |
| **TOTAL PROPUESTA** | **$9.975.000 COP** |

### **Opción 3: Propuesta Mínima Aceptable**

| Concepto | Valor |
|----------|-------|
| Completamiento Contrato Original | $6.025.000 |
| Reconocimiento Trabajo Adicional (60% descuento) | $3.160.000 |
| **TOTAL PROPUESTA** | **$9.185.000 COP** |

---

## 📝 NOTAS IMPORTANTES

1. **Descuento Aplicado:** Las propuestas incluyen un descuento del 30-60% sobre el valor técnico del trabajo adicional, considerando la relación comercial.

2. **Mantenimiento Correctivo:** El flujo de mantenimiento correctivo requiere desarrollo completamente independiente y será cotizado por separado cuando se requiera ($4.500.000 - $5.000.000 estimado).

3. **Sitio Web Corporativo:** Pendiente de desarrollo según contrato original (puede ser incluido en negociación separada).

4. **Garantía:** Todas las funcionalidades adicionales están implementadas y funcionando. Se incluye soporte técnico por 30 días después del pago.

---

## ✅ ENTREGABLES INCLUIDOS

- ✅ Código fuente completo
- ✅ Documentación técnica
- ✅ Manual de usuario
- ✅ Soporte técnico 30 días
- ✅ Capacitación básica al equipo

---

**Fecha de Emisión:** [Fecha]  
**Vigencia de Cotización:** 15 días  
**Forma de Pago:** Transferencia bancaria  
**Cuenta:** 24124683655 - Banco Caja Social

---

**Desarrollador:**  
Joiner Antonio Dávila Saiz  
C.C. 1.141.515.075

**Cliente:**  
CARINI SAS  
NIT: 900.635.489-8  
Representante Legal: Mauricio Carini Imperi