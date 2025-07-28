import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { getMantenimientoById } from '../../../services/MantenimientoService';
import { useAuth } from '../../../context/AuthContext';

export default function DetalleMantenimiento() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = useAuth();
  const { id } = route.params as { id: number };

  const [loading, setLoading] = useState(true);
  const [mantenimiento, setMantenimiento] = useState<any>(null);

  useEffect(() => {
    const fetchMantenimiento = async () => {
      try {
        const data = await getMantenimientoById(id, token);
        setMantenimiento(data);
      } catch (error) {
        console.error('Error al obtener mantenimiento:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token && id) fetchMantenimiento();
  }, [id, token]);

  const traducirEstado = (estadoIngles: string): string => {
    const traducciones: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignado',
      in_progress: 'En progreso',
      completed: 'Completado',
      canceled: 'Cancelado',
    };
    return traducciones[estadoIngles] || estadoIngles;
  };

  if (loading) {
    return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0077b6" />
        </View>
    );
  }

  if (!mantenimiento) {
    return (
        <View style={styles.loaderContainer}>
          <Text style={{ color: '#999' }}>No se encontró el mantenimiento.</Text>
        </View>
    );
  }

  return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Detalle del Mantenimiento</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Tipo:</Text>
          <Text style={styles.value}>
            {mantenimiento.type === 'preventivo' ? 'Preventivo' : 'Correctivo'}
          </Text>

          <Text style={styles.label}>Estado:</Text>
          <Text style={styles.value}>{traducirEstado(mantenimiento.status)}</Text>

          <Text style={styles.label}>Intervención:</Text>
          <Text style={styles.value}>{mantenimiento.intervention_type || 'No especificada'}</Text>

          <Text style={styles.label}>Fecha:</Text>
          <Text style={styles.value}>{mantenimiento.date_maintenance}</Text>

          <Text style={styles.label}>Equipo:</Text>
          <Text style={styles.value}>{mantenimiento.device?.model || 'Sin modelo'}</Text>

          <Text style={styles.label}>Técnico Asignado:</Text>
          <Text style={styles.value}>
            {mantenimiento.technician?.full_name || 'No asignado'}
          </Text>

          <Text style={styles.label}>Descripción:</Text>
          <Text style={styles.value}>{mantenimiento.description || 'Sin descripción'}</Text>

          {mantenimiento.image && (
              <>
                <Text style={styles.label}>Foto:</Text>
                <Image source={{ uri: mantenimiento.image }} style={styles.image} />
              </>
          )}
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: '#fff',
  },
  title: {
    marginTop: 30,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0077b6',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  label: {
    fontWeight: 'bold',
    color: '#03045e',
    marginTop: 10,
  },
  value: {
    color: '#333',
    marginBottom: 5,
  },
  image: {
    marginTop: 10,
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00b4d8',
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
