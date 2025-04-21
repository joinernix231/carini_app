import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function DetalleEquipo() {
  const equipo = {
    name: 'Lavadora Industrial 30kg',
    reference: 'LV-30',
    serial: 'SN-849123A',
    status: 'Operativo',
    location: 'Planta Principal - Zona 3',
    linkedAt: '12 abril 2024',
    image: 'https://carini.co/wp-content/uploads/2023/01/RENDER1_page-0002.jpg',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <FontAwesome5 name="warehouse" style={styles.icon} size={40} color="#fff" />
        <Text style={styles.title}>{equipo.name}</Text>
      </View>

      {/* Imagen destacada del equipo */}
      <Image
        source={{ uri: equipo.image }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.infoBox}>
        <InfoRow label="Referencia" value={equipo.reference} icon="description" />
        <InfoRow label="Serial" value={equipo.serial} icon="qr-code" />
        <InfoRow
          label="Estado"
          value={equipo.status}
          icon="check-circle"
          color={equipo.status === 'Operativo' ? '#2ecc71' : '#e74c3c'}
        />
        <InfoRow label="Ubicación" value={equipo.location} icon="location-on" />
        <InfoRow label="Vinculado desde" value={equipo.linkedAt} icon="calendar-today" />
      </View>

      <View style={styles.buttonGroup}>
        <ActionButton icon="history" label="Ver historial" />
        <ActionButton icon="file-download" label="Manual" />
        <ActionButton icon="edit" label="Editar" />
      </View>
    </ScrollView>
  );
}

const InfoRow = ({ label, value, icon, color = '#0077b6' }: any) => (
  <View style={styles.infoRow}>
    <MaterialIcons name={icon} size={22} color={color} style={styles.icon} />
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const ActionButton = ({ icon, label }: { icon: any; label: string }) => (
  <TouchableOpacity style={styles.actionButton}>
    <MaterialIcons name={icon} size={24} color="#0077b6" />
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9ff',
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
