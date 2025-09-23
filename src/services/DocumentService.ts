// src/services/DocumentService.ts
import API from './api';

interface UploadFile {
    uri: string;
    name: string;
    type: string;
}

interface UploadResponse {
    success: boolean;
    message: string;
    url?: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  url?: string;
}

export class DocumentService {
  static async uploadDocument(
    file: UploadFile,
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      
      // Agregar el nombre en el nivel raíz
      formData.append('name', file.name || 'documento');
      
      // Agregar el archivo con sus metadatos
      formData.append('file', file as any);

      const response = await API.post('/api/loadDoc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });

      return {
        success: true,
        message: 'Documento subido correctamente',
        url: response.data.url || response.data.data?.url,
      };
    } catch (error: any) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        message: error?.response?.data?.message || 'Error al subir el documento',
      };
    }
  }

  static async uploadImage(
    image: any,
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<DocumentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.name || 'image.jpg',
      } as any);

      const response = await API.post('/loadDoc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return {
        success: true,
        message: 'Imagen subida exitosamente',
        url: response.data.url || response.data.data?.url,
      };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        message: error?.response?.data?.message || 'Error al subir la imagen',
      };
    }
  }
}



