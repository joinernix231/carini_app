import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfileService, UserProfileData, ProfileUpdateData } from '../services/UserProfileService';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  token: string;
  onEdit?: (field: string, value: string) => void;
}

export default function UserProfileModal({ 
  visible, 
  onClose, 
  token, 
  onEdit 
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState<ProfileUpdateData>({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (visible && token) {
      loadProfile();
    }
  }, [visible, token]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await UserProfileService.getUserProfile(token);
      setProfile(profileData);
    } catch (err: any) {
      setError(err.message || 'Error cargando perfil');
      // Error log removed
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: string, value: string) => {
    if (onEdit) {
      onEdit(field, value);
    } else {
      initializeEditData();
      setShowEditForm(true);
    }
  };

  const initializeEditData = () => {
    if (!profile) return;

    const data: ProfileUpdateData = {
      name: profile.name || '',
      email: profile.email || '',
    };

    switch (profile.role) {
      case 'cliente':
        if (profile.client_data) {
          data.phone = profile.client_data.phone || '';
          data.address = profile.client_data.address || '';
          data.city = profile.client_data.city || '';
          data.department = profile.client_data.department || '';
          data.legal_representative = profile.client_data.legal_representative || '';
          data.client_type = profile.client_data.client_type as 'Natural' | 'Jurídico' || 'Natural';
          data.document_type = profile.client_data.document_type as 'CC' | 'CE' | 'CI' | 'PASS' | 'NIT' || 'CC';
          data.document = profile.client_data.identifier || '';
        }
        break;
      case 'tecnico':
        if (profile.technician_data) {
          data.phone = profile.technician_data.phone || '';
          data.address = profile.technician_data.address || '';
          data.document = profile.technician_data.document || '';
        }
        break;
      case 'coordinador':
        if (profile.coordinator_data) {
          data.phone = profile.coordinator_data.phone || '';
          data.address = profile.coordinator_data.address || '';
          data.identification = parseInt(profile.coordinator_data.identification) || 0;
        }
        break;
    }

    setEditData(data);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Validaciones comunes
    if (!editData.name || editData.name.trim() === '') {
      errors.push('El nombre es requerido');
    } else if (editData.name.length > 255) {
      errors.push('El nombre no puede tener más de 255 caracteres');
    }

    if (!editData.email || editData.email.trim() === '') {
      errors.push('El email es requerido');
    } else if (!isValidEmail(editData.email)) {
      errors.push('El email debe tener un formato válido');
    }

    if (editData.phone && editData.phone.length > 20) {
      errors.push('El teléfono no puede tener más de 20 caracteres');
    }

    if (editData.address && editData.address.length > 255) {
      errors.push('La dirección no puede tener más de 255 caracteres');
    }

    // Validaciones específicas para cliente
    if (profile?.role === 'cliente') {
      if (editData.city && editData.city.length > 255) {
        errors.push('La ciudad no puede tener más de 255 caracteres');
      }

      if (editData.department && editData.department.length > 255) {
        errors.push('El departamento no puede tener más de 255 caracteres');
      }

      if (editData.legal_representative && editData.legal_representative.length > 255) {
        errors.push('El representante legal no puede tener más de 255 caracteres');
      }

      if (editData.document && editData.document.length > 20) {
        errors.push('El documento no puede tener más de 20 caracteres');
      }

      // Validar que si es tipo Jurídico, debe tener representante legal
      if (editData.client_type === 'Jurídico' && (!editData.legal_representative || editData.legal_representative.trim() === '')) {
        errors.push('El representante legal es requerido para clientes jurídicos');
      }
    }

    // Validaciones para técnico
    if (profile?.role === 'tecnico' && editData.document && editData.document.length > 20) {
      errors.push('El documento no puede tener más de 20 caracteres');
    }

    // Validaciones para coordinador
    if (profile?.role === 'coordinador' && editData.identification && !Number.isInteger(Number(editData.identification))) {
      errors.push('La identificación debe ser un número entero');
    }

    if (errors.length > 0) {
      Alert.alert('Error de validación', errors.join('\n'));
      return false;
    }

    return true;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEditSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setEditLoading(true);
      
      // Filtrar solo los campos que tienen valor
      const dataToSend: ProfileUpdateData = {};
      Object.entries(editData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          dataToSend[key as keyof ProfileUpdateData] = value;
        }
      });

      await UserProfileService.updateProfile(token, dataToSend);
      
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setShowEditForm(false);
      await loadProfile(); // Recargar el perfil
    } catch (error: any) {
      // Error log removed
      Alert.alert('Error', error.message || 'Error al actualizar el perfil');
    } finally {
      setEditLoading(false);
    }
  };

  const renderProfileItem = (
    label: string,
    value: string | number | null | undefined,
    icon: keyof typeof MaterialIcons.glyphMap
  ) => {
    if (value === null || value === undefined) return null;
    
    return (
      <View style={styles.profileItem}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} size={22} color="#0077b6" />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemLabel}>{label}</Text>
          <Text style={styles.itemValue}>{String(value)}</Text>
        </View>
      </View>
    );
  };

  const renderRoleSpecificData = () => {
    if (!profile) return null;

    switch (profile.role) {
      case 'cliente':
        return profile.client_data ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="business-center" size={24} color="#0077b6" />
              <Text style={styles.sectionTitle}>Información del Cliente</Text>
            </View>
            {renderProfileItem('Identificador', profile.client_data.identifier, 'badge')}
            {renderProfileItem('Tipo de Cliente', profile.client_data.client_type, 'business')}
            {renderProfileItem('Tipo de Documento', profile.client_data.document_type, 'description')}
            {renderProfileItem('Dirección', profile.client_data.address, 'location-on')}
            {renderProfileItem('Ciudad', profile.client_data.city, 'location-city')}
            {renderProfileItem('Departamento', profile.client_data.department, 'public')}
            {renderProfileItem('Teléfono', profile.client_data.phone, 'phone')}
            {renderProfileItem('Estado', profile.client_data.status, 'check-circle')}
            {renderProfileItem('Dispositivos', profile.client_data.devices_count, 'devices')}
            {renderProfileItem('Contactos', profile.client_data.contacts_count, 'contacts')}
            {profile.client_data.legal_representative && 
              renderProfileItem('Representante Legal', profile.client_data.legal_representative, 'person')
            }
          </View>
        ) : null;

      case 'tecnico':
        return profile.technician_data ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="engineering" size={24} color="#0077b6" />
              <Text style={styles.sectionTitle}>Información del Técnico</Text>
            </View>
            {renderProfileItem('Documento', profile.technician_data.document, 'badge')}
            {renderProfileItem('Teléfono', profile.technician_data.phone, 'phone')}
            {renderProfileItem('Dirección', profile.technician_data.address, 'location-on')}
            {renderProfileItem('Estado', profile.technician_data.status, 'check-circle')}
            {renderProfileItem('Mantenimientos Totales', profile.technician_data.maintenances_count, 'build')}
            {renderProfileItem('Mantenimientos Activos', profile.technician_data.active_maintenances_count, 'assignment')}
          </View>
        ) : null;

      case 'coordinador':
        return profile.coordinator_data ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="supervisor-account" size={24} color="#0077b6" />
              <Text style={styles.sectionTitle}>Información del Coordinador</Text>
            </View>
            {renderProfileItem('Identificación', profile.coordinator_data.identification, 'badge')}
            {renderProfileItem('Dirección', profile.coordinator_data.address, 'location-on')}
            {renderProfileItem('Teléfono', profile.coordinator_data.phone, 'phone')}
            {renderProfileItem('Estado', profile.coordinator_data.status, 'check-circle')}
          </View>
        ) : null;

      default:
        return null;
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'cliente': 'Cliente',
      'tecnico': 'Técnico',
      'coordinador': 'Coordinador',
      'administrador': 'Administrador'
    };
    return roleMap[role] || role;
  };

  interface FormField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'number' | 'select';
    required: boolean;
    options?: string[];
  }

  const getFieldsForRole = (): FormField[] => {
    if (!profile) return [];

    const baseFields: FormField[] = [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Teléfono', type: 'tel', required: false },
      { key: 'address', label: 'Dirección', type: 'text', required: false },
    ];

    switch (profile.role) {
      case 'cliente':
        return [
          ...baseFields,
          { key: 'city', label: 'Ciudad', type: 'text', required: false },
          { key: 'department', label: 'Departamento', type: 'text', required: false },
          { key: 'legal_representative', label: 'Representante Legal', type: 'text', required: false },
          { key: 'client_type', label: 'Tipo de Cliente', type: 'select', required: true, options: ['Natural', 'Jurídico'] },
          { key: 'document_type', label: 'Tipo de Documento', type: 'select', required: true, options: ['CC', 'CE', 'CI', 'PASS', 'NIT'] },
          { key: 'document', label: 'Documento', type: 'text', required: false },
        ];
      case 'tecnico':
        return [
          ...baseFields,
          { key: 'document', label: 'Documento', type: 'text', required: false },
        ];
      case 'coordinador':
        return [
          ...baseFields,
          { key: 'identification', label: 'Identificación', type: 'number', required: false },
        ];
      default:
        return baseFields;
    }
  };

  const renderEditForm = () => {
    if (!showEditForm || !profile) return null;

    const fields = getFieldsForRole();

    return (
      <View style={styles.editFormContainer}>
        <View style={styles.editFormCard}>
          <View style={styles.editFormHeader}>
            <View style={styles.editFormTitleContainer}>
              <MaterialIcons name="edit" size={24} color="#0077b6" />
              <Text style={styles.editFormTitle}>Editar Perfil</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowEditForm(false)}
              style={styles.editFormCloseButton}
            >
              <MaterialIcons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

        <ScrollView style={styles.editFormContent}>
          {fields.map((field) => {
            // Mostrar representante legal solo si es tipo Jurídico
            if (field.key === 'legal_representative' && editData.client_type !== 'Jurídico') {
              return null;
            }

            return (
              <View key={field.key} style={styles.editFieldContainer}>
                <Text style={styles.editFieldLabel}>
                  {field.label} {field.required && <Text style={styles.required}>*</Text>}
                </Text>
                
                {field.type === 'select' ? (
                  <View style={styles.selectContainer}>
                    {field.options?.map((option: string) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.selectOption,
                          editData[field.key as keyof ProfileUpdateData] === option && styles.selectOptionSelected
                        ]}
                        onPress={() => {
                          setEditData(prev => ({ ...prev, [field.key]: option }));
                        }}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          editData[field.key as keyof ProfileUpdateData] === option && styles.selectOptionTextSelected
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    style={styles.editFieldInput}
                    value={String(editData[field.key as keyof ProfileUpdateData] || '')}
                    onChangeText={(text) => {
                      const newValue = field.type === 'number' ? parseInt(text) || 0 : text;
                      setEditData(prev => ({ ...prev, [field.key]: newValue }));
                    }}
                    keyboardType={field.type === 'email' ? 'email-address' : field.type === 'tel' ? 'phone-pad' : field.type === 'number' ? 'numeric' : 'default'}
                    placeholder={`Ingrese ${field.label.toLowerCase()}`}
                    editable={!editLoading}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.editFormButtons}>
          <TouchableOpacity 
            style={[styles.editFormButton, styles.cancelButton]} 
            onPress={() => setShowEditForm(false)}
            disabled={editLoading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.editFormButton, styles.saveButton]} 
            onPress={handleEditSave}
            disabled={editLoading}
          >
            {editLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
      </View>
    );
  };

  const getRoleIcon = (role: string) => {
    const iconMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
      'cliente': 'business-center',
      'tecnico': 'engineering',
      'coordinador': 'supervisor-account',
      'administrador': 'admin-panel-settings'
    };
    return iconMap[role] || 'person';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#005a8d" />
        
        {/* Header con gradiente */}
        <LinearGradient
          colors={['#0077b6', '#005a8d']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Mi Perfil</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                initializeEditData();
                setShowEditForm(true);
              }}
              style={styles.headerEditButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="edit" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0077b6" />
            <Text style={styles.loadingText}>Cargando perfil...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <MaterialIcons name="error-outline" size={64} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Error al cargar</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              onPress={loadProfile} 
              style={styles.retryButton}
              activeOpacity={0.8}
            >
              <MaterialIcons name="refresh" size={20} color="#fff" style={styles.retryIcon} />
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : profile ? (
          <ScrollView 
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Card de Usuario */}
            <View style={styles.userCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profile.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.roleBadge}>
                  <MaterialIcons name={getRoleIcon(profile.role)} size={16} color="#fff" />
                </View>
              </View>
              <Text style={styles.userName}>{profile.name}</Text>
              <View style={styles.roleContainer}>
                <MaterialIcons name={getRoleIcon(profile.role)} size={16} color="#0077b6" />
                <Text style={styles.userRole}>{getRoleDisplayName(profile.role)}</Text>
              </View>
            </View>

            {/* Información Básica */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="info" size={24} color="#0077b6" />
                <Text style={styles.sectionTitle}>Información Básica</Text>
              </View>
              {renderProfileItem('Nombre Completo', profile.name, 'person')}
              {renderProfileItem('Correo Electrónico', profile.email, 'email')}
              {renderProfileItem('Política Aceptada', profile.policy_accepted ? 'Sí' : 'No', 'policy')}
              {renderProfileItem('Fecha de Registro', new Date(profile.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }), 'calendar-today')}
              {renderProfileItem('Última Actualización', new Date(profile.updated_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }), 'update')}
            </View>

            {/* Información Específica del Rol */}
            {renderRoleSpecificData()}

            {/* Espacio adicional al final */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        ) : null}

        {/* Formulario de edición */}
        {renderEditForm()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 24,
  },
  userCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0077b6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0077b6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0077b6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0077b6',
    marginLeft: 6,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 10,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EBF8FF',
  },
  headerEditButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#0077b6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0077b6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 16,
  },
  // Estilos para el formulario de edición
  editFormContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  editFormCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  editFormTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  editFormTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  editFormCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  editFormContent: {
    backgroundColor: '#fff',
    maxHeight: 500,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  editFieldContainer: {
    marginBottom: 20,
  },
  editFieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  editFieldInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editFormButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  editFormButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#0077b6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Estilos para campos de selección
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectOptionSelected: {
    backgroundColor: '#0077b6',
    borderColor: '#0077b6',
    shadowColor: '#0077b6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  selectOptionTextSelected: {
    color: '#fff',
  },
});