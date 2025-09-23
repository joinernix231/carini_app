import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoordinadorList from "./Coordinador/CoordinadorList";

type RootStackParamList = {
  ClienteList: undefined;
  TecnicoList: undefined;
  VerMantenimientos: undefined;
  AsignarTecnicos: undefined;
  VerTecnicos: undefined;
  AsignarEquipos: undefined;
  VerClientes: undefined;
  EquipoList: undefined;
  CoordinadorList: undefined;
};

type MenuOption = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  screen: keyof RootStackParamList;
  color: string;
  bgColor: string;
  description: string;
};

const options: MenuOption[] = [
  {
    icon: 'groups', // 👈 buen ícono para clientes
    label: 'Clientes',
    screen: 'ClienteList',
    color: '#1565C0',
    bgColor: '#E3F2FD',
    description: 'Gestiona clientes',
  },
    {
        icon: 'people',
        label: 'Técnicos',
        screen: 'TecnicoList',
        color: '#26A69A',
        bgColor: '#E0F2F1',
        description: 'Gestionar personal'
    },
    {
        icon: 'people',
        label: 'Coordinadores',
        screen: 'CoordinadorList',
        color: '#3c1642',
        bgColor: '#F3E5F5',
        description: 'Gestionar personal'
    },

    {
        icon: 'edit',
        label: 'Equipos',
        screen: 'EquipoList',
        color: '#AB47BC',
        bgColor: '#F3E5F5',
        description: 'Editar información'
    },
    {
        icon: 'engineering',
        label: 'Mantenimientos',
        screen: 'VerMantenimientos',
        color: '#1E88E5',
        bgColor: '#E3F2FD',
        description: 'Ver programados'
    },
];

export default function AdminDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();

  const renderItem = ({ item }: { item: MenuOption }) => (
      <TouchableOpacity
          style={[styles.item, { backgroundColor: item.bgColor }]}
          onPress={() => navigation.navigate(item.screen)}
          activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
          <MaterialIcons name={item.icon} size={28} color="#fff" />
        </View>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.description}>{item.description}</Text>
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0077b6" />
        <LinearGradient colors={['#00b4d8', '#0077b6', '#023e8a']} style={styles.root}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                <MaterialIcons name="admin-panel-settings" size={60} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.title}>{user?.name ?? 'Administrador'}</Text>
              <Text style={styles.subtitle}>Gestión administrativa</Text>
            </View>

            {/* Menu Grid */}
            <View style={styles.contentContainer}>
              <FlatList
                  data={options}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.label}
                  numColumns={2} // 👈 Solo una columna porque es un item
                  contentContainerStyle={styles.grid}
                  showsVerticalScrollIndicator={false}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialIcons name="logout" size={22} color="#fff" />
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0077b6',
  },
  root: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingTop: 20,
  },
  avatarContainer: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 25,
    marginTop: 20,
  },
  grid: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  item: {
    flex: 1,
    margin: 10,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(120, 0, 0, 0.9)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
});
