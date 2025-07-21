import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';

export default function MiEmpresa() {
  const { user } = useAuth();

  const mockEmpresa = {
    legal_representative: 'Carlos Martínez',
    client_type: 'empresa',
    identifier: '900123456-7',
    address: 'Calle 45 #12-34',
    city: 'Bogotá',
    email: 'empresa@carini.com',
    phone: '3011234567',
  };

  const handleEdit = (field: string) => {
    Alert.alert(`Editar ${field}`, `Aquí podrías abrir un formulario para editar ${field}.`);
  };

  const renderItem = (
    label: string,
    value: string,
    icon: keyof typeof MaterialIcons.glyphMap,
    editable: boolean = false
  ) => (
    <View style={styles.item}>
      <MaterialIcons name={icon} size={26} color="#0077b6" style={styles.icon} />
      <View style={styles.itemContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {editable && (
        <TouchableOpacity onPress={() => handleEdit(label)}>
          <MaterialIcons name="edit" size={20} color="#555" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Información de la Empresa</Text>
      {renderItem('Representante Legal', mockEmpresa.legal_representative, 'person', true)}
      {renderItem('Tipo de Cliente', mockEmpresa.client_type, 'business')}
      {renderItem('Identificación', mockEmpresa.identifier, 'badge')}
      {renderItem('Dirección', mockEmpresa.address, 'location-on', true)}
      {renderItem('Ciudad', mockEmpresa.city, 'location-city', true)}
      {renderItem('Correo', mockEmpresa.email, 'email', true)}
      {renderItem('Teléfono', mockEmpresa.phone, 'phone', true)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0077b6',
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
  },
  icon: {
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
});
