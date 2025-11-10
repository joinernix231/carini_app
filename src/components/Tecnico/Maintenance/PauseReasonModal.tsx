import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickReason {
  id: string;
  label: string;
  icon: string;
}

interface PauseReasonModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

const QUICK_REASONS: QuickReason[] = [
  { id: 'lunch', label: 'Almuerzo', icon: 'restaurant' },
  { id: 'break', label: 'Descanso', icon: 'cafe' },
  { id: 'emergency', label: 'Emergencia', icon: 'alert-circle' },
  { id: 'parts', label: 'Falta repuesto', icon: 'construct' },
  { id: 'other', label: 'Otro motivo', icon: 'chatbox-ellipses' },
];

export function PauseReasonModal({ visible, onCancel, onConfirm, loading }: PauseReasonModalProps) {
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const finalReason = selectedQuickReason
      ? QUICK_REASONS.find((r) => r.id === selectedQuickReason)?.label || ''
      : customReason.trim();

    if (finalReason) {
      onConfirm(finalReason);
      // Limpiar estados
      setSelectedQuickReason(null);
      setCustomReason('');
    }
  };

  const handleCancel = () => {
    setSelectedQuickReason(null);
    setCustomReason('');
    onCancel();
  };

  const hasReason = selectedQuickReason !== null || customReason.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={handleCancel} />
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="pause-circle" size={32} color="#FF9500" />
              </View>
              <Text style={styles.modalTitle}>Pausar Mantenimiento</Text>
              <Text style={styles.modalSubtitle}>
                Indica el motivo de la pausa para continuar más tarde
              </Text>
            </View>

            {/* Razones Rápidas */}
            <View style={styles.quickReasonsContainer}>
              <Text style={styles.quickReasonsTitle}>Razones Rápidas</Text>
              <View style={styles.quickReasonsGrid}>
                {QUICK_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.quickReasonButton,
                      selectedQuickReason === reason.id && styles.quickReasonButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedQuickReason(reason.id);
                      setCustomReason('');
                    }}
                    disabled={loading}
                  >
                    <Ionicons
                      name={reason.icon as any}
                      size={24}
                      color={selectedQuickReason === reason.id ? '#fff' : '#FF9500'}
                    />
                    <Text
                      style={[
                        styles.quickReasonText,
                        selectedQuickReason === reason.id && styles.quickReasonTextActive,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Separador */}
            <View style={styles.modalDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o escribe tu motivo</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Campo de Texto */}
            <View style={styles.customReasonContainer}>
              <TextInput
                style={styles.customReasonInput}
                placeholder="Escribe el motivo de la pausa..."
                placeholderTextColor="#8E8E93"
                value={customReason}
                onChangeText={(text) => {
                  setCustomReason(text);
                  setSelectedQuickReason(null);
                }}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                scrollEnabled
                autoFocus
                editable={!loading}
              />
            </View>
          </ScrollView>

          {/* Botones - Fuera del ScrollView para que siempre sean visibles */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalConfirmButton,
                (!hasReason || loading) && styles.modalConfirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!hasReason || loading}
            >
              <Ionicons name="pause" size={20} color="#fff" />
              <Text style={styles.modalConfirmButtonText}>
                {loading ? 'Pausando...' : 'Pausar Ahora'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    flexDirection: 'column',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollViewContent: {
    paddingBottom: 10,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickReasonsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickReasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  quickReasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickReasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9500',
    backgroundColor: '#FFF',
    minWidth: '48%',
    gap: 8,
  },
  quickReasonButtonActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  quickReasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  quickReasonTextActive: {
    color: '#fff',
  },
  modalDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginHorizontal: 12,
    fontWeight: '500',
  },
  customReasonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  customReasonInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000',
    minHeight: 140,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 24,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8E8E93',
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});


