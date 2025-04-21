import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedBubbles from '../../components/AnimatedBubbles';

type RootStackParamList = {
  MisEquipos: undefined;
  SolicitarMantenimiento: undefined;
  Historial: undefined;
  Productos: undefined;
};

type MenuOption = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  screen: keyof RootStackParamList;
};

const options: MenuOption[] = [
  { icon: 'inventory', label: 'Mis Equipos', screen: 'MisEquipos' },
  { icon: 'build', label: 'Solicitar Mantenimiento', screen: 'SolicitarMantenimiento' },
  { icon: 'history', label: 'Historial', screen: 'Historial' },
  { icon: 'shopping-cart', label: 'Productos', screen: 'Productos' },
  { icon: 'face', label: 'Mi Perfil', screen: 'Productos' },
];

export default function ClienteDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const renderItem = ({ item }: { item: MenuOption }) => (
    <TouchableOpacity style={styles.item} onPress={() => navigation.navigate(item.screen)}>
      <MaterialIcons name={item.icon} size={36} color="#0077b6" />
      <Text style={styles.label}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
    colors={['#00b4d8', '#0077b6']} // Gradiente entre dos tonos de azul
    style={styles.root}
  >
    
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {user?.name ?? 'Usuario'}</Text>
      <FlatList
        data={options}
        renderItem={renderItem}
        keyExtractor={(item) => item.label}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  grid: {
    justifyContent: 'center',
    paddingBottom: 40,
  },
  item: {
    flex: 1,
    margin: 10,
    backgroundColor: '#caf0f8',
    borderRadius: 16,
    paddingVertical: 25,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#03045e',
    textAlign: 'center',
  },
});
