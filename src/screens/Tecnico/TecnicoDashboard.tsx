import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  MisMantenimientos: undefined;
  MiPerfil: undefined;
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
    icon: 'build',
    label: 'Mis Mantenimientos',
    screen: 'MisMantenimientos',
    color: '#FF7043',
    bgColor: '#FFF3E0',
    description: 'Gestiona tus servicios'
  },
  {
    icon: 'account-circle',
    label: 'Mi Perfil',
    screen: 'MiPerfil',
    color: '#26A69A',
    bgColor: '#E0F2F1',
    description: 'Información personal'
  },
];

export default function TecnicoDashboard() {
  const { navigate } = useSmartNavigation();
  const { user, logout } = useAuth();

  const renderItem = ({ item }: { item: MenuOption }) => (
      <TouchableOpacity
          style={[styles.item, { backgroundColor: item.bgColor }]}
          onPress={() => navigate(item.screen)}
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
                <MaterialIcons name="engineering" size={60} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.title}>{user?.name ?? 'Técnico'}</Text>
              <Text style={styles.subtitle}>Panel de Control Técnico</Text>
            </View>
            {/* Menu Grid */}
            <View style={styles.contentContainer}>
              <FlatList
                  data={options}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.label}
                  numColumns={2}
                  contentContainerStyle={styles.grid}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
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
    paddingVertical: 20,
    paddingTop: 50,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 25,
    marginTop: 10,
  },
  grid: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  item: {
    flex: 1,
    margin: 7.5,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
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
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
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