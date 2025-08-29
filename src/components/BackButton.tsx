import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, GestureResponderEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export type BackButtonProps = {
  onPress?: (event: GestureResponderEvent) => void;
  color?: string;
  size?: number;
  style?: ViewStyle | ViewStyle[];
  iconName?: string; // Permite cambiar el icono si se desea
  label?: string; // Texto opcional junto al icono
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
};

/**
 * Botón reutilizable para regresar a la pantalla anterior.
 * Uso básico:
 *   <BackButton />
 * Personalización:
 *   <BackButton color="#000" size={28} style={{ marginLeft: 8 }} label="Atrás" />
 */
const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  color = '#fff',
  size = 24,
  style,
  iconName = 'arrow-back',
  label,
  labelStyle,
  accessibilityLabel = 'Volver',
  hitSlop = { top: 10, bottom: 10, left: 10, right: 10 },
}) => {
  const navigation = useNavigation<any>();

  const handlePress = (e: GestureResponderEvent) => {
    if (onPress) return onPress(e);
    if (navigation && navigation.goBack) navigation.goBack();
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      onPress={handlePress}
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <MaterialIcons name={iconName as any} size={size} color={color} />
      {label ? <Text style={[styles.label, { color }, labelStyle]}>{label}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  label: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BackButton;
