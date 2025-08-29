import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

type RootStackParamList = {
  VerMantenimientos: undefined;
  AsignarTecnicos: undefined;
  VerTecnicos: undefined;
  AsignarEquipos: undefined;
  VerClientes: undefined;
  EditarEquipos: undefined;
};

type MenuOption = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  screen: keyof RootStackParamList;
};

const options: MenuOption[] = [
  { icon: 'engineering', label: 'Mantenimientos Programados', screen: 'VerMantenimientos' },
  { icon: 'assignment-ind', label: 'Mantenimietos por programar', screen: 'AsignarTecnicos' },
  { icon: 'people', label: 'Listado Tecnicos', screen: 'VerTecnicos' },
  { icon: 'edit', label: 'Editar Equipos', screen: 'EditarEquipos' },
];



export default function CoordinadorDashboard() {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();

  const renderItem = ({ item }: { item: MenuOption }) => (
    <TouchableOpacity style={styles.item} onPress={() => navigation.navigate(item.screen)}>
      <MaterialIcons name={item.icon} size={36} color="#0077b6" />
      <Text style={styles.label}>{item.label}</Text>
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, salir', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <LinearGradient colors={['#00b4d8', '#0077b6']} style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>Panel del Coordinador</Text>
        <Text style={styles.subtitle}>Hola, {user?.name ?? 'Coordinador'}</Text>

        <FlatList
          data={options}
          renderItem={renderItem}
          keyExtractor={(item) => item.label}
          numColumns={2}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#caf0f8',
    textAlign: 'center',
    marginBottom: 20,
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
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#780000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});
