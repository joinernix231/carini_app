import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import API from '../../services/api'; // Importa tu Axios ya configurado
import { useAuth } from '../../context/AuthContext'; // Usa el token

type Equipo = {
  id: number;
  device: {
    id: number;
    model: string;
    brand: string;
    serial: string;
    type: string;
    manufactured_at: string;
  };
  address: string;
};

type RootStackParamList = {
  MisEquipos: undefined;
  SolicitarMantenimiento: undefined;
  Historial: undefined;
  Productos: undefined;
};

export default function MisEquipos() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { token } = useAuth(); // aquí obtenemos el token
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (token) {
      fetchEquipos();
    }
  }, [token]);

  const fetchEquipos = async () => {
    try {
      const response = await API.get('api/linkDevices', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('API Response', response.data);

      const equiposFromApi = response.data.data.data; // 👈 Aquí está el array real
      setEquipos(equiposFromApi);
    } catch (error) {
      console.error('Error fetching equipos', error);
      Alert.alert('Error', 'No se pudieron cargar los equipos.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScanner = async () => {
    if (permission?.granted) {
      setScannerVisible(true);
    } else {
      const { granted } = await requestPermission();
      if (granted) {
        setScannerVisible(true);
      } else {
        Alert.alert('Permiso denegado', 'Debes permitir el acceso a la cámara.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configuración', onPress: () => Linking.openSettings() },
        ]);
      }
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScannerVisible(false);
    Alert.alert('Código escaneado', `Código: ${data}`);
  };

  const renderItem = ({ item }: { item: Equipo }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('DetalleEquipo')}
    >
      <MaterialIcons name="settings" size={24} color="#0077b6" />
      <Text style={styles.cardTitle}>{item.device.model}</Text> {/* 👈 Mostrar el modelo */}
      <Text style={styles.cardSubtitle}>Serial: {item.device.serial}</Text>
      <Text style={styles.cardSubtitle}>Marca: {item.device.brand}</Text>
      <Text style={styles.estado}>{item.address}</Text> {/* 👈 Dirección */}
      <View style={styles.verDetalleContainer}>
        <Text style={styles.verDetalleText}>Ver detalle</Text>
        <MaterialIcons name="arrow-forward" size={16} color="#0077b6" />
      </View>
    </TouchableOpacity>
  );
  

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0077b6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mis Equipos</Text>

      <TouchableOpacity style={styles.qrButton} onPress={handleOpenScanner}>
        <MaterialIcons name="qr-code-scanner" size={20} color="#fff" />
        <Text style={styles.qrButtonText}>Agregar equipo con QR</Text>
      </TouchableOpacity>

      <FlatList
        data={equipos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />

      <Modal visible={scannerVisible} animationType="slide">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setScannerVisible(false)}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>Cerrar</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// Tus estilos siguen igual 🎯



const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, paddingTop:30, textAlign: 'center' },
  qrButton: {
    backgroundColor: '#0077b6',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#555' },
  estado: { fontSize: 13, marginTop: 5, fontStyle: 'italic' },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#0077b6',
    padding: 10,
    borderRadius: 8,
  },
  verDetalleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  verDetalleText: {
    color: '#0077b6',
    fontWeight: 'bold',
    marginRight: 5,
  },
});