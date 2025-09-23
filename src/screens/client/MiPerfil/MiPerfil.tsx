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
import BackButton from '../../../components/BackButton';

export default function MiPerfil() {
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
        <TouchableOpacity onPress={() => handleEdit(label)} style={styles.editButton}>
          <MaterialIcons name="edit" size={20} color="#0077b6" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton style={{ marginRight: 10 }} color="#000" size={24} />
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Información de la Empresa</Text>

        {renderItem('Representante Legal', mockEmpresa.legal_representative, 'person', true)}
        {renderItem('Tipo de Cliente', mockEmpresa.client_type, 'business')}
        {renderItem('Identificación', mockEmpresa.identifier, 'badge')}
        {renderItem('Dirección', mockEmpresa.address, 'location-on', true)}
        {renderItem('Ciudad', mockEmpresa.city, 'location-city', true)}
        {renderItem('Correo', mockEmpresa.email, 'email', true)}
        {renderItem('Teléfono', mockEmpresa.phone, 'phone', true)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0077b6',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  editButton: {
    padding: 4,
  },
});
