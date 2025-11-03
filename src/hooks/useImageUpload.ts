// src/hooks/useImageUpload.ts
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';
import { uploadImage as uploadImageService } from '../services/UploadImage';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';

export interface ImageUploadOptions {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
  defaultName?: string; // Nombre por defecto para la imagen
}

export interface ImageUploadState {
  imageUri: string | null;
  uploading: boolean;
  error: string | null;
}

export function useImageUpload(options: ImageUploadOptions = {}) {
  const { token } = useAuth();
  const { showError } = useError();
  
  const [state, setState] = useState<ImageUploadState>({
    imageUri: null,
    uploading: false,
    error: null,
  });

  const pickImage = useCallback(async () => {
    try {
      // Solicitar permisos de galería antes de acceder a ella
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        if (canAskAgain) {
          // El usuario negó, pero aún podemos volver a preguntar
          Alert.alert(
            'Permisos requeridos',
            'Necesitamos acceso a la galería para seleccionar fotos de los equipos.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Intentar de nuevo', onPress: () => pickImage() }
            ]
          );
        } else {
          // El usuario negó permanentemente
          Alert.alert(
            'Permiso denegado',
            'Debes habilitar el acceso a la galería desde los ajustes de tu dispositivo.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir ajustes', onPress: () => Linking.openSettings() }
            ]
          );
        }
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setState(prev => ({
          ...prev,
          imageUri: result.assets[0].uri,
          error: null,
        }));
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error en pickImage:', error);
      showError(error, 'Error al seleccionar la imagen');
      setState(prev => ({
        ...prev,
        error: 'Error al seleccionar la imagen',
      }));
      return null;
    }
  }, [options, showError]);

  const takePhoto = useCallback(async () => {
    try {
      // Solicitar permisos de cámara antes de usar la cámara
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        if (canAskAgain) {
          // El usuario negó, pero aún podemos volver a preguntar
          Alert.alert(
            'Permisos requeridos',
            'Necesitamos acceso a la cámara para tomar fotos de los equipos.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Intentar de nuevo', onPress: () => takePhoto() }
            ]
          );
        } else {
          // El usuario negó permanentemente
          Alert.alert(
            'Permiso denegado',
            'Debes habilitar el acceso a la cámara desde los ajustes de tu dispositivo.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir ajustes', onPress: () => Linking.openSettings() }
            ]
          );
        }
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setState(prev => ({
          ...prev,
          imageUri: result.assets[0].uri,
          error: null,
        }));
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error en takePhoto:', error);
      showError(error, 'Error al tomar la foto');
      setState(prev => ({
        ...prev,
        error: 'Error al tomar la foto',
      }));
      return null;
    }
  }, [options, showError]);

  const uploadImage = useCallback(async (uri: string, customName?: string): Promise<string | null> => {
    if (!token) {
      setState(prev => ({ ...prev, error: 'No hay token de autenticación' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, uploading: true, error: null }));
      
      // Usar el nombre personalizado, el nombre por defecto de las opciones, o generar uno genérico
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const baseName = customName || options.defaultName || 'image';
      const encryptedName = `${baseName}_${timestamp}_${randomString}`;
      
      const response = await uploadImageService(uri, encryptedName, token);
      
      // Si el servidor devuelve un nombre, usarlo; si no, usar el nombre generado
      const imageName = response.image_name || response.image_url || response.filename || encryptedName;
      
      if (imageName) {
        setState(prev => ({
          ...prev,
          uploading: false,
          error: null,
        }));
        return imageName;
      } else {
        // Si no hay nombre del servidor, usar el nombre generado
        setState(prev => ({
          ...prev,
          uploading: false,
          error: null,
        }));
        return encryptedName;
      }
    } catch (error) {
      // Error log removed
      showError(error, 'Error al subir la imagen');
      setState(prev => ({
        ...prev,
        uploading: false,
        error: 'Error al subir la imagen',
      }));
      return null;
    }
  }, [token, showError, options.defaultName]);

  const clearImage = useCallback(() => {
    setState({
      imageUri: null,
      uploading: false,
      error: null,
    });
  }, []);

  const setImageUri = useCallback((uri: string | null) => {
    setState(prev => ({
      ...prev,
      imageUri: uri,
      error: null,
    }));
  }, []);

  return {
    ...state,
    pickImage,
    takePhoto,
    uploadImage,
    clearImage,
    setImageUri,
  };
}
