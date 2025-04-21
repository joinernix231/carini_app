import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Equipo = {
  id: number;
  nombre: string;
  referencia: string;
  estado: string;
};


type RootStackParamList = {
  MisEquipos: undefined;
  SolicitarMantenimiento: undefined;
  Historial: undefined;
  Productos: undefined;
};




const equiposMock: Equipo[] = [
  { id: 1, nombre: 'Lavadora Industrial 30kg', referencia: 'LI-30K', estado: 'Operativo' },
  { id: 2, nombre: 'Secadora 20kg Gas', referencia: 'SD-20G', estado: 'En mantenimiento' },
];

export default function MisEquipos() {
  const [equipos, setEquipos] = useState<Equipo[]>(equiposMock);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleOpenScanner = async () => {
    if (permission?.granted) {
      setScannerVisible(true);
    } else {
      const { granted } = await requestPermission();
      if (granted) {
        setScannerVisible(true);
      } else {
        Alert.alert(
          'Permiso denegado',
          'Debes permitir el acceso a la cámara para escanear el código QR.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir configuración', onPress: () => Linking.openSettings() },
          ]
        );
      }
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScannerVisible(false);

    const nuevoEquipo = {
      id: Math.random(),
      nombre: `Equipo ${data}`,
      referencia: data,
      estado: 'Nuevo',
    };
    setEquipos((prev) => [...prev, nuevoEquipo]);

    Alert.alert('Equipo detectado', `Se agregó el equipo con código: ${data}`);
  };

  

  const renderItem = ({ item }: { item: Equipo }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('DetalleEquipo')}
    >
      <MaterialIcons name="settings" size={24} color="#0077b6" />
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text style={styles.cardSubtitle}>Ref: {item.referencia}</Text>
      <Text style={styles.estado}>{item.estado}</Text>
      <View style={styles.verDetalleContainer}>
        <Text style={styles.verDetalleText}>Ver detalle</Text>
        <MaterialIcons name="arrow-forward" size={16} color="#0077b6" />
      </View>
    </TouchableOpacity>
  );
  

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