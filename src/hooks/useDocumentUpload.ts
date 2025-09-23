// src/hooks/useDocumentUpload.ts
import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { DocumentService } from '../services/DocumentService';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';

export interface DocumentUploadOptions {
  type?: string;
  copyToCacheDirectory?: boolean;
  defaultName?: string; // Nombre por defecto para el documento
}

export interface DocumentUploadState {
  documentUri: string | null;
  documentName: string | null;
  uploading: boolean;
  error: string | null;
}

export function useDocumentUpload(options: DocumentUploadOptions = {}) {
  const { token } = useAuth();
  const { showError } = useError();
  
  const [state, setState] = useState<DocumentUploadState>({
    documentUri: null,
    documentName: null,
    uploading: false,
    error: null,
  });

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: options.type || 'application/pdf',
        copyToCacheDirectory: options.copyToCacheDirectory ?? true,
      });

      if (!result.canceled && result.assets[0]) {
        setState(prev => ({
          ...prev,
          documentUri: result.assets[0].uri,
          documentName: result.assets[0].name,
          error: null,
        }));
        return {
          uri: result.assets[0].uri,
          name: result.assets[0].name,
        };
      }
      return null;
    } catch (error) {
      console.error('Error picking document:', error);
      showError(error, 'Error al seleccionar el documento');
      setState(prev => ({
        ...prev,
        error: 'Error al seleccionar el documento',
      }));
      return null;
    }
  }, [options, showError]);

  const uploadDocument = useCallback(async (uri: string, name: string, customName?: string): Promise<string | null> => {
    if (!token) {
      setState(prev => ({ ...prev, error: 'No hay token de autenticación' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, uploading: true, error: null }));
      
      // Usar el nombre personalizado, el nombre por defecto de las opciones, o generar uno genérico
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const baseName = customName || options.defaultName || 'documento';
      const encryptedName = `${baseName}_${timestamp}_${randomString}`;
      
      const file = {
        uri,
        type: 'application/pdf',
        name: encryptedName,
      };
      
      const response = await DocumentService.uploadDocument(file, token, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      
      if (response.success && response.url) {
        setState(prev => ({
          ...prev,
          uploading: false,
          error: null,
        }));
        return response.url;
      } else {
        // Si no hay URL del servidor, usar el nombre generado
        setState(prev => ({
          ...prev,
          uploading: false,
          error: null,
        }));
        return encryptedName;
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      showError(error, 'Error al subir el documento');
      setState(prev => ({
        ...prev,
        uploading: false,
        error: 'Error al subir el documento',
      }));
      return null;
    }
  }, [token, showError, options.defaultName]);

  const clearDocument = useCallback(() => {
    setState({
      documentUri: null,
      documentName: null,
      uploading: false,
      error: null,
    });
  }, []);

  const setDocument = useCallback((uri: string | null, name: string | null = null) => {
    setState(prev => ({
      ...prev,
      documentUri: uri,
      documentName: name,
      error: null,
    }));
  }, []);

  return {
    ...state,
    pickDocument,
    uploadDocument,
    clearDocument,
    setDocument,
  };
}
