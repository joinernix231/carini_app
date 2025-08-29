import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../context/AuthContext';
import { createCliente } from '../../../services/ClienteService';

// Local stack typing
 type RootStackParamList = {
  ClienteList: undefined;
  DetalleCliente: { id: number };
 };

export default function CrearCliente() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [legalRepresentative, setLegalRepresentative] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Validación', 'El nombre es requerido');
      return false;
    }
    if (!identifier.trim()) {
      Alert.alert('Validación', 'La identificación es requerida');
      return false;
    }
    // Email opcional, pero si lo ingresan, validamos formato básico
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Validación', 'El email no es válido');
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!token) {
      Alert.alert('Error', 'No hay sesión activa');
      return;
    }
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        identifier: identifier.trim(),
        email: email.trim() || null,
        legal_representative: legalRepresentative.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        phone: phone.trim() || null,
      } as const;

      const res: any = await createCliente(payload as any, token);

      const created = res?.data ?? res; // handle { success, data } or plain object
      const newId = created?.id ?? res?.id;

      Alert.alert('Éxito', 'Cliente creado correctamente', [
        {
          text: 'Ver detalle',
          onPress: () => {
            if (newId) {
              navigation.replace('DetalleCliente', { id: Number(newId) });
            } else {
              navigation.navigate('ClienteList');
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error creando cliente:', error?.response?.data ?? error);
      const msg = error?.response?.data?.message || 'No se pudo crear el cliente';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackButton style={{ marginBottom: 10 }} color="#000" size={24} />

        <Text style={styles.title}>Crear cliente</Text>
        <Text style={styles.subtitle}>Completa la información para registrar un nuevo cliente</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Nombre*</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Tech Solutions S.A."
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Identificación*</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 1141515074 / NIT"
            placeholderTextColor="#999"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="default"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: contacto@empresa.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />


          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Carrera 15 #45-60"
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Ciudad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Bogotá"
            placeholderTextColor="#999"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: +57 3001234567"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.8 }]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.submitText}>Crear cliente</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#000', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 16, fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  label: { fontSize: 13, color: '#666', marginTop: 12, marginBottom: 6, fontWeight: '700' },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
