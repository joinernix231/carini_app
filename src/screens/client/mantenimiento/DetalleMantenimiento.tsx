import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function DetalleMantenimiento() {
  const navigation = useNavigation();

  // 🔹 Datos de prueba
  const mantenimiento = {
    tipo: 'Correctivo',
    estado: 'Pendiente',
    tipoIntervencion: 'Cambio de repuesto',
    fecha: '2024-05-12',
    equipo: 'Lavadora 30kg',
    tecnico: 'Joiner Davila',
    descripcion: 'La lavadora tiene problemas con el motor y hace ruidos extraños.',
    imagen:
      'https://media.licdn.com/dms/image/v2/C561BAQFfGtP_pZF_Vw/company-background_10000/company-background_10000/0/1619554213481/carini_sas_lavadoras_industriales_cover?e=2147483647&v=beta&t=Bu7j14R93AlCh1oO5M61qJpC64mcd6MV75Dw6EZuMuM',
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalle del Mantenimiento</Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Tipo:</Text>
        <Text style={styles.value}>{mantenimiento.tipo}</Text>

        <Text style={styles.label}>Estado:</Text>
        <Text style={styles.value}>{mantenimiento.estado}</Text>

        <Text style={styles.label}>Intervención:</Text>
        <Text style={styles.value}>{mantenimiento.tipoIntervencion}</Text>

        <Text style={styles.label}>Fecha:</Text>
        <Text style={styles.value}>{mantenimiento.fecha}</Text>

        <Text style={styles.label}>Equipo:</Text>
        <Text style={styles.value}>{mantenimiento.equipo}</Text>

        <Text style={styles.label}>Tecnico Asignado:</Text>
        <Text style={styles.value}>{mantenimiento.tecnico}</Text>

        <Text style={styles.label}>Descripción:</Text>
        <Text style={styles.value}>{mantenimiento.descripcion}</Text>

        {mantenimiento.imagen && (
          <>
            <Text style={styles.label}>Foto:</Text>
            <Image source={{ uri: mantenimiento.imagen }} style={styles.image} />
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
  title: {
    marginTop:30,
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
