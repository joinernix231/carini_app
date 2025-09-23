// src/components/ImageUploader.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useImageUpload, ImageUploadOptions } from '../hooks/useImageUpload';

interface ImageUploaderProps {
  title?: string;
  initialImageUri?: string | null;
  onImageChange?: (uri: string | null) => void;
  onImageUploaded?: (imageName: string | null) => void;
  options?: ImageUploadOptions;
  disabled?: boolean;
  required?: boolean;
  imageName?: string; // Nombre personalizado para la imagen
}

export default function ImageUploader({
  title = 'Imagen',
  initialImageUri = null,
  onImageChange,
  onImageUploaded,
  options = {},
  disabled = false,
  required = false,
  imageName,
}: ImageUploaderProps) {
  const {
    imageUri,
    uploading,
    error,
    pickImage,
    takePhoto,
    uploadImage,
    clearImage,
    setImageUri,
  } = useImageUpload(options);

  // Inicializar solo una vez con la imagen inicial
  React.useEffect(() => {
    if (initialImageUri) {
      setImageUri(initialImageUri);
    }
  }, []); // Solo se ejecuta una vez al montar

  // Notificar cambios
  React.useEffect(() => {
    onImageChange?.(imageUri);
  }, [imageUri, onImageChange]);

  const handlePickImage = async () => {
    if (disabled) return;
    const uri = await pickImage();
    if (uri && onImageUploaded) {
      const uploadedName = await uploadImage(uri, imageName);
      onImageUploaded(uploadedName);
    }
  };

  const handleTakePhoto = async () => {
    if (disabled) return;
    const uri = await takePhoto();
    if (uri && onImageUploaded) {
      const uploadedName = await uploadImage(uri, imageName);
      onImageUploaded(uploadedName);
    }
  };

  const handleRemoveImage = () => {
    if (disabled) return;
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro que deseas eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            clearImage();
            onImageChange?.(null);
            onImageUploaded?.(null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {title}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      <View style={styles.imageContainer}>
        {imageUri ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>Vista previa</Text>
            </View>
            {!disabled && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
            <Text style={styles.placeholderText}>Sin imagen</Text>
          </View>
        )}
      </View>

      {!disabled && (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, uploading && { opacity: 0.6 }]}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={20} color="#3B82F6" />
            <Text style={styles.buttonText}>Galería</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, uploading && { opacity: 0.6 }]}
            onPress={handleTakePhoto}
            disabled={uploading}
          >
            <Ionicons name="camera-outline" size={20} color="#3B82F6" />
            <Text style={styles.buttonText}>Cámara</Text>
          </TouchableOpacity>
        </View>
      )}

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.uploadingText}>Subiendo imagen...</Text>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  required: {
    color: '#EF4444',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  buttonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});


