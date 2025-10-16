import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';

type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';
type MaintenanceType = 'preventivo' | 'correctivo';
type TimeSlot = 'AM' | 'PM';

interface Maintenance {
  id: string;
  client: {
    name: string;
    company: string;
    address: string;
    phone: string;
  };
  equipment: {
    type: 'lavadora' | 'secadora';
    brand: string;
    model: string;
    serial: string;
  };
  type: MaintenanceType;
  date: string;
  timeSlot: TimeSlot;
  status: MaintenanceStatus;
  description?: string;
  createdAt: string;
}

const mockMaintenances: Maintenance[] = [
  {
    id: '1',
    client: {
      name: 'Hotel Gran Plaza',
      company: 'Hoteles Plaza S.A.',
      address: 'Calle 72 #10-25, Bogotá',
      phone: '+57 1 234-5678'
    },
    equipment: {
      type: 'lavadora',
      brand: 'Whirlpool',
      model: 'WFW5620HW',
      serial: 'WP2024001'
    },
    type: 'preventivo',
    date: '2025-09-06',
    timeSlot: 'AM',
    status: 'pending',
    description: 'Mantenimiento preventivo programado',
    createdAt: '2025-09-05T08:00:00Z'
  },
  {
    id: '2',
    client: {
      name: 'Lavandería Express',
      company: 'Servicios de Lavado Ltda.',
      address: 'Carrera 15 #45-67, Bogotá',
      phone: '+57 1 987-6543'
    },
    equipment: {
      type: 'secadora',
      brand: 'LG',
      model: 'DLEX3570V',
      serial: 'LG2024002'
    },
    type: 'correctivo',
    date: '2025-09-06',
    timeSlot: 'PM',
    status: 'in_progress',
    description: 'Problema con el sistema de calentamiento',
    createdAt: '2025-09-05T10:30:00Z'
  },
  {
    id: '3',
    client: {
      name: 'Clínica San Rafael',
      company: 'IPS San Rafael',
      address: 'Avenida 68 #25-30, Bogotá',
      phone: '+57 1 555-0123'
    },
    equipment: {
      type: 'lavadora',
      brand: 'Samsung',
      model: 'WF45R6100AC',
      serial: 'SM2024003'
    },
    type: 'preventivo',
    date: '2025-09-05',
    timeSlot: 'AM',
    status: 'completed',
    description: 'Mantenimiento preventivo completado',
    createdAt: '2025-09-04T09:15:00Z'
  }
];

export default function MisMantenimientos() {
  const { goBack } = useSmartNavigation();
  const [maintenances, setMaintenances] = useState<Maintenance[]>(mockMaintenances);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [comments, setComments] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'all'>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'completed': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getStatusText = (status: MaintenanceStatus) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      default: return 'Desconocido';
    }
  };

  const getEquipmentIcon = (type: 'lavadora' | 'secadora') => {
    return type === 'lavadora' ? 'local-laundry-service' : 'dry-cleaning';
  };

  const getMaintenanceTypeColor = (type: MaintenanceType) => {
    return type === 'preventivo' ? '#4CAF50' : '#FF5722';
  };

  const filteredMaintenances = maintenances.filter(m => 
    filterStatus === 'all' || m.status === filterStatus
  );

  const startMaintenance = (maintenance: Maintenance) => {
    Alert.alert(
      'Iniciar Mantenimiento',
      `¿Deseas iniciar el mantenimiento en ${maintenance.client.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: () => {
            setMaintenances(prev =>
              prev.map(m =>
                m.id === maintenance.id ? { ...m, status: 'in_progress' } : m
              )
            );
          }
        }
      ]
    );
  };

  const openCompletionModal = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setCompletionModalVisible(true);
    setComments('');
    setPhotos([]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const completeMaintenance = () => {
    if (selectedMaintenance) {
      setMaintenances(prev =>
        prev.map(m =>
          m.id === selectedMaintenance.id ? { ...m, status: 'completed' } : m
        )
      );
      setCompletionModalVisible(false);
      Alert.alert('Éxito', 'Mantenimiento marcado como completado');
    }
  };

  const renderMaintenanceItem = ({ item }: { item: Maintenance }) => (
    <TouchableOpacity
      style={styles.maintenanceCard}
      onPress={() => {
        setSelectedMaintenance(item);
        setModalVisible(true);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.equipmentInfo}>
          <View style={[styles.equipmentIconContainer, { backgroundColor: getMaintenanceTypeColor(item.type) }]}>
            <MaterialIcons 
              name={getEquipmentIcon(item.equipment.type)} 
              size={24} 
              color="#fff" 
            />
          </View>
          <View style={styles.equipmentDetails}>
            <Text style={styles.clientName}>{item.client.name}</Text>
            <Text style={styles.equipmentText}>
              {item.equipment.brand} {item.equipment.model}
            </Text>
            <Text style={styles.serialText}>Serial: {item.equipment.serial}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={16} color="#666" />
          <Text style={styles.infoText}>{item.date} - {item.timeSlot}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>{item.client.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons 
            name={item.type === 'preventivo' ? 'schedule' : 'build'} 
            size={16} 
            color={getMaintenanceTypeColor(item.type)} 
          />
          <Text style={[styles.infoText, { color: getMaintenanceTypeColor(item.type) }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => startMaintenance(item)}
          >
            <MaterialIcons name="play-arrow" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Iniciar</Text>
          </TouchableOpacity>
        )}
        {item.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => openCompletionModal(item)}
          >
            <MaterialIcons name="check" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Completar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionButton, styles.detailsButton]}>
          <MaterialIcons name="info" size={20} color="#2196F3" />
          <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Detalles</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ status, label }: { status: MaintenanceStatus | 'all', label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterStatus === status && styles.filterButtonActive
      ]}
      onPress={() => setFilterStatus(status)}
    >
      <Text style={[
        styles.filterButtonText,
        filterStatus === status && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0077b6" />
      <LinearGradient colors={['#00b4d8', '#0077b6', '#023e8a']} style={styles.root}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={goBack}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Mis Mantenimientos</Text>
              <Text style={styles.subtitle}>Gestiona tus servicios asignados</Text>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <FilterButton status="all" label="Todos" />
              <FilterButton status="pending" label="Pendientes" />
              <FilterButton status="in_progress" label="En Progreso" />
              <FilterButton status="completed" label="Completados" />
            </ScrollView>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <FlatList
              data={filteredMaintenances}
              renderItem={renderMaintenanceItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="work-off" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No hay mantenimientos</Text>
                </View>
              }
            />
          </View>
        </View>
      </LinearGradient>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle del Mantenimiento</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedMaintenance && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Cliente</Text>
                  <Text style={styles.detailText}>{selectedMaintenance.client.name}</Text>
                  <Text style={styles.detailSubtext}>{selectedMaintenance.client.company}</Text>
                  <Text style={styles.detailSubtext}>{selectedMaintenance.client.address}</Text>
                  <Text style={styles.detailSubtext}>{selectedMaintenance.client.phone}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Equipo</Text>
                  <Text style={styles.detailText}>
                    {selectedMaintenance.equipment.brand} {selectedMaintenance.equipment.model}
                  </Text>
                  <Text style={styles.detailSubtext}>
                    Tipo: {selectedMaintenance.equipment.type.charAt(0).toUpperCase() + selectedMaintenance.equipment.type.slice(1)}
                  </Text>
                  <Text style={styles.detailSubtext}>Serial: {selectedMaintenance.equipment.serial}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Servicio</Text>
                  <Text style={styles.detailText}>
                    {selectedMaintenance.type.charAt(0).toUpperCase() + selectedMaintenance.type.slice(1)}
                  </Text>
                  <Text style={styles.detailSubtext}>
                    Fecha: {selectedMaintenance.date} - {selectedMaintenance.timeSlot}
                  </Text>
                  <Text style={styles.detailSubtext}>
                    Estado: {getStatusText(selectedMaintenance.status)}
                  </Text>
                </View>

                {selectedMaintenance.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.detailText}>{selectedMaintenance.description}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Completion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={completionModalVisible}
        onRequestClose={() => setCompletionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Completar Mantenimiento</Text>
              <TouchableOpacity onPress={() => setCompletionModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.completionSection}>
                <Text style={styles.sectionTitle}>Comentarios</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe el trabajo realizado..."
                  multiline
                  numberOfLines={4}
                  value={comments}
                  onChangeText={setComments}
                />
              </View>

              <View style={styles.completionSection}>
                <Text style={styles.sectionTitle}>Evidencias Fotográficas</Text>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <MaterialIcons name="add-a-photo" size={24} color="#2196F3" />
                  <Text style={styles.photoButtonText}>Agregar Foto</Text>
                </TouchableOpacity>
                
                <View style={styles.photosGrid}>
                  {photos.map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.photoThumb} />
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.completeMaintenanceButton} onPress={completeMaintenance}>
                <MaterialIcons name="check-circle" size={24} color="#fff" />
                <Text style={styles.completeMaintenanceText}>Marcar como Completado</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0077b6',
  },
  root: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  filtersContainer: {
    marginBottom: 15,
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#fff',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#0077b6',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  maintenanceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  equipmentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  equipmentDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  equipmentText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 1,
  },
  serialText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  completeButton: {
    backgroundColor: '#FF9800',
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  detailSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  completionSection: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
  },
  photoButtonText: {
    marginLeft: 8,
    color: '#2196F3',
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  completeMaintenanceButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeMaintenanceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});