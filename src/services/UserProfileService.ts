// src/services/UserProfileService.ts
import API from './api';

export interface UserProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  policy_accepted: boolean;
  created_at: string;
  updated_at: string;
  client_data?: {
    identifier: string;
    name: string;
    legal_representative?: string | null;
    address: string;
    city: string;
    department?: string | null;
    email?: string | null;
    phone: string;
    status: string;
    client_type: string;
    document_type: string;
    created_at: string;
    updated_at: string;
    devices_count: number;
    contacts_count: number;
  };
  technician_data?: {
    document: string;
    phone?: string;
    address?: string;
    status: string;
    created_at: string;
    updated_at: string;
    maintenances_count: number;
    active_maintenances_count: number;
  };
  coordinator_data?: {
    identification: string;
    address?: string;
    phone?: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
}

export interface UserProfileResponse {
  success: boolean;
  data: UserProfileData;
  message: string;
}

// Tipos para actualización de perfil
export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;                    // Solo para cliente
  department?: string;              // Solo para cliente
  legal_representative?: string;     // Solo para cliente (tipo Jurídico)
  client_type?: 'Natural' | 'Jurídico'; // Solo para cliente
  document_type?: 'CC' | 'CE' | 'CI' | 'PASS' | 'NIT'; // Solo para cliente
  document?: string;                // Para cliente y técnico
  identification?: number;          // Solo para coordinador
}

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const UserProfileService = {
  /**
   * Obtiene el perfil completo del usuario autenticado
   */
  async getUserProfile(token: string): Promise<UserProfileData> {
    try {
      console.log('🔍 UserProfileService - Obteniendo perfil del usuario...');
      
      const response = await API.get('/api/me', authHeaders(token));
      
      // Log removed
      
      return response.data.data;
    } catch (error: any) {
      // Error log removed
      throw new Error(error.response?.data?.message || 'Error obteniendo perfil del usuario');
    }
  },

  /**
   * Actualiza el perfil del usuario
   */
  async updateUserProfile(
    token: string, 
    updates: Partial<UserProfileData>
  ): Promise<UserProfileData> {
    try {
      console.log('🔍 UserProfileService - Actualizando perfil...', updates);
      
      const response = await API.put('/api/user/profile', updates, authHeaders(token));
      
      // Log removed
      
      return response.data.data;
    } catch (error: any) {
      // Error log removed
      throw new Error(error.response?.data?.message || 'Error actualizando perfil del usuario');
    }
  },

  /**
   * Actualiza el perfil del usuario usando el endpoint /api/profile
   */
  async updateProfile(
    token: string, 
    profileData: ProfileUpdateData
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 UserProfileService - Actualizando perfil con datos:', profileData);
      
      const response = await API.put('/api/profile', profileData, authHeaders(token));
      
      // Log removed
      
      return response.data;
    } catch (error: any) {
      // Error log removed
      throw new Error(error.response?.data?.message || 'Error actualizando perfil del usuario');
    }
  }
};
