import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface SparePartSuggestion {
  id: number;
  client_device_id: number;
  device: {
    id: number;
    brand: string;
    model: string;
    serial: string;
    type: string;
  };
  description: string;
  photo: string | null;
  photo_name: string | null;
  created_at: string;
}

interface SparePartSuggestionCardProps {
  suggestion: SparePartSuggestion;
}

export default function SparePartSuggestionCard({ suggestion }: SparePartSuggestionCardProps) {
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (type: string) => {
    const deviceType = type?.toLowerCase() || '';
    if (deviceType.includes('lavadora')) return 'local-laundry-service';
    if (deviceType.includes('secadora')) return 'dry-cleaning';
    return 'build';
  };

  return (
    <>
      <View style={styles.card}>
        {/* Header con gradiente */}
        <LinearGradient
          colors={['#FF9500', '#FF7A00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardHeader}
        >
          <View style={styles.cardHeaderContent}>
            <View style={styles.deviceIconContainer}>
              <MaterialIcons 
                name={getDeviceIcon(suggestion.device.type) as any} 
                size={24} 
                color="#fff" 
              />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.deviceName}>
                {suggestion.device.brand} {suggestion.device.model}
              </Text>
              <Text style={styles.deviceSerial}>
                Serial: {suggestion.device.serial || 'N/A'}
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="information-circle" size={16} color="#FF9500" />
            </View>
          </View>
        </LinearGradient>

        {/* Contenido */}
        <View style={styles.cardContent}>
          {/* Descripción */}
          <View style={styles.descriptionContainer}>
            <View style={styles.descriptionHeader}>
              <MaterialIcons name="description" size={18} color="#FF9500" />
              <Text style={styles.descriptionLabel}>Sugerencia del técnico</Text>
            </View>
            <Text style={styles.descriptionText}>{suggestion.description}</Text>
          </View>

          {/* Foto si existe */}
          {suggestion.photo && (
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={() => setImageModalVisible(true)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: suggestion.photo }}
                style={styles.photo}
                resizeMode="cover"
              />
              <View style={styles.photoOverlay}>
                <Ionicons name="expand" size={20} color="#fff" />
                <Text style={styles.photoOverlayText}>Ver foto</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Fecha */}
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color="#999" />
            <Text style={styles.dateText}>
              Sugerido el {formatDate(suggestion.created_at)}
            </Text>
          </View>

          {/* Mensaje informativo */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color="#0077b6" />
            <Text style={styles.infoBannerText}>
              Si estás en un lugar remoto, puede ser necesario programar otra visita para instalar este repuesto.
            </Text>
          </View>
        </View>
      </View>

      {/* Modal para foto ampliada */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalOverlay}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.imageModalContent}>
              <Image
                source={{ uri: suggestion.photo! }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.closeImageButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    padding: 16,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  deviceSerial: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  photo: {
    width: '100%',
    height: 200,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  photoOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0077b6',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: width - 40,
    height: width - 40,
    position: 'relative',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  closeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 4,
  },
});

