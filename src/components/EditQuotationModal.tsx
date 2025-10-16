import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DocumentUploader from './DocumentUploader';

interface EditQuotationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    is_paid: boolean | null;
    value: number | null;
    price_support: string | null;
  }) => void;
  currentData: {
    is_paid: boolean | null;
    value: number | null;
    price_support: string | null;
  };
}

export default function EditQuotationModal({
  visible,
  onClose,
  onSave,
  currentData,
}: EditQuotationModalProps) {
  const [isPaid, setIsPaid] = useState<boolean | null>(currentData.is_paid);
  const [value, setValue] = useState<string>(currentData.value?.toString() || '');
  const [priceSupport, setPriceSupport] = useState<string | null>(currentData.price_support);

  const handleSave = () => {
    // Validaciones
    if (isPaid === false && (!priceSupport || value.trim() === '')) {
      Alert.alert('Error', 'Si requiere pago, debes subir un PDF y especificar el valor');
      return;
    }

    if (isPaid === false) {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue) || numericValue <= 0) {
        Alert.alert('Error', 'El valor debe ser un número mayor a 0');
        return;
      }
    }

    onSave({
      is_paid: isPaid,
      value: isPaid === false ? parseFloat(value) : null,
      price_support: isPaid === false ? priceSupport : null,
    });
  };

  const handleClose = () => {
    // Resetear valores
    setIsPaid(currentData.is_paid);
    setValue(currentData.value?.toString() || '');
    setPriceSupport(currentData.price_support);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Editar Cotización</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Mantenimiento</Text>
            
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={[styles.radioOption, isPaid === false && styles.radioOptionSelected]}
                onPress={() => setIsPaid(false)}
              >
                <View style={[styles.radioCircle, isPaid === false && styles.radioCircleSelected]}>
                  {isPaid === false && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioContent}>
                  <Text style={[styles.radioTitle, isPaid === false && styles.radioTitleSelected]}>
                    Requiere Pago
                  </Text>
                  <Text style={styles.radioDescription}>
                    El cliente debe pagar antes de asignar técnico
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, isPaid === null && styles.radioOptionSelected]}
                onPress={() => setIsPaid(null)}
              >
                <View style={[styles.radioCircle, isPaid === null && styles.radioCircleSelected]}>
                  {isPaid === null && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioContent}>
                  <Text style={[styles.radioTitle, isPaid === null && styles.radioTitleSelected]}>
                    No Requiere Pago
                  </Text>
                  <Text style={styles.radioDescription}>
                    Se puede asignar técnico directamente
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {isPaid === false && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalles del Pago</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Valor del Mantenimiento *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 150000"
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.uploadContainer}>
                <DocumentUploader
                  title="Cotización PDF *"
                  onDocumentUploaded={(url) => setPriceSupport(url)}
                  options={{ mimeTypes: ['application/pdf'] }}
                  required
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1976D2',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  radioContainer: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  radioOptionSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#F3F4F6',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: '#1976D2',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1976D2',
  },
  radioContent: {
    flex: 1,
    marginLeft: 12,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  radioTitleSelected: {
    color: '#1976D2',
  },
  radioDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#374151',
  },
  uploadContainer: {
    marginBottom: 20,
  },
});
