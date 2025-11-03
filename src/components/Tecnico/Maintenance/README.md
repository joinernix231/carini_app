# 📦 Componentes de Mantenimiento - Técnico

Componentes reutilizables para el flujo de mantenimientos del rol técnico.

---

## 📁 Estructura

```
src/components/Tecnico/Maintenance/
├── MaintenanceCard.tsx      # Tarjeta de mantenimiento
├── StatusBadge.tsx          # Badge de estado
├── PauseReasonModal.tsx     # Modal de pausa
├── index.ts                 # Exportaciones centralizadas
└── README.md               # Esta documentación
```

---

## 🎨 Componentes

### 1. **MaintenanceCard**

Tarjeta completa para mostrar información de un mantenimiento.

#### **Props**

```typescript
interface MaintenanceCardProps {
  maintenance: TecnicoMaintenance;  // Objeto de mantenimiento
  onPress: () => void;               // Callback al presionar
}
```

#### **Ejemplo de Uso**

```typescript
import { MaintenanceCard } from '@/components/Tecnico/Maintenance';

function MisMantenimientos() {
  const handlePress = (id: number) => {
    navigate('DetalleMantenimiento', { maintenanceId: id });
  };

  return (
    <FlatList
      data={maintenances}
      renderItem={({ item }) => (
        <MaintenanceCard
          maintenance={item}
          onPress={() => handlePress(item.id)}
        />
      )}
    />
  );
}
```

#### **Características**
- ✅ Muestra cliente, estado, equipo, fecha, turno y ubicación
- ✅ Navegación inteligente según el estado
- ✅ Botón dinámico: "Ver Detalle" o "Continuar Trabajo"
- ✅ Diseño moderno con sombras y bordes redondeados

---

### 2. **StatusBadge**

Badge visual para mostrar el estado de un mantenimiento.

#### **Props**

```typescript
interface StatusBadgeProps {
  status: MaintenanceStatus;           // Estado del mantenimiento
  size?: 'small' | 'medium' | 'large'; // Tamaño del badge (default: 'medium')
}
```

#### **Ejemplo de Uso**

```typescript
import { StatusBadge } from '@/components/Tecnico/Maintenance';

function MaintenanceDetail() {
  return (
    <View>
      <StatusBadge status="in_progress" size="large" />
      <StatusBadge status="completed" size="medium" />
      <StatusBadge status="assigned" size="small" />
    </View>
  );
}
```

#### **Estados Soportados**
- `assigned` - Azul (#007AFF)
- `in_progress` - Naranja (#FF9500)
- `completed` - Verde (#34C759)

#### **Tamaños**
- `small` - Icon: 12px, Text: 11px, Padding: 8x4
- `medium` - Icon: 14px, Text: 12px, Padding: 12x6
- `large` - Icon: 16px, Text: 14px, Padding: 16x8

---

### 3. **PauseReasonModal**

Modal profesional para capturar la razón de pausa de un mantenimiento.

#### **Props**

```typescript
interface PauseReasonModalProps {
  visible: boolean;              // Controla visibilidad del modal
  onCancel: () => void;          // Callback al cancelar
  onConfirm: (reason: string) => void;  // Callback al confirmar con razón
  loading?: boolean;             // Estado de carga (default: false)
}
```

#### **Ejemplo de Uso**

```typescript
import { PauseReasonModal } from '@/components/Tecnico/Maintenance';

function MantenimientoEnProgreso() {
  const [showModal, setShowModal] = useState(false);
  const [pausing, setPausing] = useState(false);

  const handleConfirm = async (reason: string) => {
    setPausing(true);
    try {
      await pauseMaintenance(maintenanceId, reason);
      setShowModal(false);
    } finally {
      setPausing(false);
    }
  };

  return (
    <>
      <Button onPress={() => setShowModal(true)}>Pausar</Button>
      
      <PauseReasonModal
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirm}
        loading={pausing}
      />
    </>
  );
}
```

#### **Características**
- ✅ 5 razones rápidas predefinidas (Almuerzo, Descanso, Emergencia, etc.)
- ✅ Campo de texto para razón personalizada
- ✅ Validación: requiere seleccionar una razón
- ✅ Loading state para deshabilitar durante la operación
- ✅ KeyboardAvoidingView para iOS y Android
- ✅ Diseño moderno con animaciones

#### **Razones Rápidas**
1. 🍽️ Almuerzo
2. ☕ Descanso
3. ⚠️ Emergencia
4. 🔧 Falta repuesto
5. 💬 Otro motivo

---

## 📦 Importación

### **Importación Individual**
```typescript
import { MaintenanceCard } from '@/components/Tecnico/Maintenance/MaintenanceCard';
import { StatusBadge } from '@/components/Tecnico/Maintenance/StatusBadge';
import { PauseReasonModal } from '@/components/Tecnico/Maintenance/PauseReasonModal';
```

### **Importación Centralizada (Recomendado)**
```typescript
import {
  MaintenanceCard,
  StatusBadge,
  PauseReasonModal
} from '@/components/Tecnico/Maintenance';
```

---

## 🎨 Estilos

Todos los componentes usan:
- ✅ Colores consistentes del sistema
- ✅ Sombras y elevaciones profesionales
- ✅ Bordes redondeados modernos
- ✅ Espaciado uniforme
- ✅ Responsive design

### **Paleta de Colores**
```typescript
Primary: #007AFF    // Azul iOS
Warning: #FF9500    // Naranja
Success: #34C759    // Verde
Gray: #8E8E93       // Gris texto secundario
Background: #F2F2F7 // Gris fondo
```

---

## 🧪 Testing (Futuro)

### **Ejemplo de Test para MaintenanceCard**
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { MaintenanceCard } from './MaintenanceCard';

describe('MaintenanceCard', () => {
  const mockMaintenance = {
    id: 1,
    client: { name: 'Test Client' },
    status: 'assigned',
    // ... más datos
  };

  it('should render correctly', () => {
    const { getByText } = render(
      <MaintenanceCard maintenance={mockMaintenance} onPress={() => {}} />
    );
    expect(getByText('Test Client')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MaintenanceCard maintenance={mockMaintenance} onPress={onPress} />
    );
    fireEvent.press(getByText('Ver Detalle'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

---

## 📝 Notas

### **Dependencias**
- `@expo/vector-icons` - Iconos (Ionicons, MaterialIcons)
- `react-native` - Componentes base
- `TecnicoMantenimientosService` - Servicio de datos

### **TypeScript**
Todos los componentes están completamente tipados con TypeScript para type safety.

### **Performance**
- Componentes optimizados para listas largas
- Uso eficiente de memoria
- Re-renders minimizados

---

## 🚀 Próximas Mejoras

### **Corto Plazo**
- [ ] Agregar React.memo para optimización
- [ ] Implementar tests unitarios
- [ ] Agregar animaciones de entrada/salida

### **Mediano Plazo**
- [ ] Soporte para temas (dark mode)
- [ ] Componente de skeleton loading
- [ ] Más variantes de tamaño

### **Largo Plazo**
- [ ] Storybook para documentación visual
- [ ] Accesibilidad (a11y) mejorada
- [ ] Internacionalización (i18n)

---

## 📚 Referencias

- [React Native Docs](https://reactnative.dev/)
- [Expo Icons](https://icons.expo.fyi/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Última actualización:** 29 de Octubre, 2025  
**Versión:** 1.0.0  
**Autor:** Carini App Team


