import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationIcon from '../../components/NotificationIcon';

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

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 85) / 2; 

const options: MenuOption[] = [
  {
    icon: 'groups',
    label: 'Clientes',
    screen: 'ClienteList',
    color: '#3B82F6', // Blue-500
    bgColor: '#EFF6FF', // Blue-50
    description: 'Gestión de clientes y contactos',
  },
  {
    icon: 'build',
    label: 'Técnicos',
    screen: 'TecnicoList',
    color: '#F59E0B', // Amber-500
    bgColor: '#FFFBEB', // Amber-50
    description: 'Administrar técnicos'
  },
  {	
    icon: 'badge',
    label: 'Coordinadores',
    screen: 'CoordinadorList',
    color: '#8B5CF6', // Violet-500
    bgColor: '#F5F3FF', // Violet-50
    description: 'Gestión de coordinadores'
  },
  {
    icon: 'memory',
    label: 'Equipos',
    screen: 'EquipoList',
    color: '#10B981', // Emerald-500
    bgColor: '#ECFDF5', // Emerald-50
    description: 'Gestión de equipos'
  },
  {
    icon: 'schedule',
    label: 'Mantenimientos',
    screen: 'VerMantenimientos',
    color: '#EF4444', // Red-500
    bgColor: '#FEF2F2', // Red-50
    description: 'Seguimiento de mantenimientos'
  },
];

export default function AdminDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: MenuOption }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: item.bgColor }]}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <MaterialIcons name={item.icon} size={28} color="#fff" />
      </View>
      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
        {item.label}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
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
            <View style={styles.headerTop}>
              <View style={styles.headerContent}>
                <View style={styles.avatarContainer}>
                  <MaterialIcons name="admin-panel-settings" size={60} color="rgba(255,255,255,0.9)" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.greeting}>{getGreeting()}</Text>
                  <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
                    {user?.name ?? 'Administrador'}
                  </Text>
                  <Text style={styles.subtitle}>Gestión administrativa</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <NotificationIcon color="#fff" size={24} />
              </View>
            </View>
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
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              columnWrapperStyle={styles.row}
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
    paddingVertical: 30,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
    width: '100%',
  },
  headerRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
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
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 25,
    marginTop: 20,
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  item: {
    width: ITEM_WIDTH,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    maxHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 5,
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 6,
    minHeight: 18,
  },
  description: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
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