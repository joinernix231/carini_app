import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { getEquipoVinculado } from '../../../services/EquipoClienteService';
import { useAuth } from '../../../context/AuthContext';

type RouteParams = {
  deviceId: number;
};

export default function DetalleEquipo() {
  const route = useRoute();
  const { token } = useAuth();
  const { deviceId } = route.params as RouteParams;

  const [equipo, setEquipo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && deviceId) fetchDetalle();
  }, [token, deviceId]);

  const fetchDetalle = async () => {
    try {
      const data = await getEquipoVinculado(token!, deviceId);
      setEquipo(data);
    } catch (error) {
      console.error('Error cargando equipo', error);
      Alert.alert('Error', 'No se pudo cargar el detalle del equipo.');
    } finally {
      setLoading(false);
    }
  };

  const abrirManualPDF = () => {
    const uri = equipo?.device?.pdf_url;

    console.log(uri);
    
    if (!uri) {
      Alert.alert('Manual no disponible');
      return;
    }

    Linking.openURL(uri).catch((err) => {
      console.error('Error al abrir el PDF:', err);
      Alert.alert('Error', 'No se pudo abrir el manual.');
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077b6" />
      </View>
    );
  }

  if (!equipo) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No se encontró el equipo.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <FontAwesome5 name="warehouse" style={styles.icon} size={40} color="#fff" />
        <Text style={styles.title}>{equipo.device.model}</Text>
      </View>

      <Image
        source={{ uri: equipo.device.photo }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.infoBox}>
        <InfoRow label="Referencia" value={equipo.device.type} icon="description" />
        <InfoRow label="Serial" value={equipo.device.serial} icon="qr-code" />
        <InfoRow
          label="Estado"
          value={equipo.status ? 'Operativo' : 'Inactivo'}
          icon="check-circle"
          color={equipo.status ? '#2ecc71' : '#e74c3c'}
        />
        <InfoRow label="Ubicación" value={equipo.address} icon="location-on" />
        <InfoRow
          label="Vinculado desde"
          value={equipo.created_at?.split(' ')[0]}
          icon="calendar-today"
        />
      </View>

      <View style={styles.buttonGroup}>
        <ActionButton icon="file-download" label="Manual" onPress={abrirManualPDF} />
      </View>
    </ScrollView>
  );
}

const InfoRow = ({
  label,
  value,
  icon,
  color = '#0077b6',
}: {
  label: string;
  value: string;
  icon: any;
  color?: string;
}) => (
  <View style={styles.infoRow}>
    <MaterialIcons name={icon} size={22} color={color} style={styles.icon} />
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const ActionButton = ({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <MaterialIcons name={icon} size={24} color="#0077b6" />
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#0077b6',
    paddingTop: 45,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  image: {
    width: '90%',
    height: 200,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 20,
    backgroundColor: '#ccc',
  },
  infoBox: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginTop: 20,
    paddingBottom: 40,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#0077b6',
    fontWeight: '600',
    marginTop: 4,
  },
});
