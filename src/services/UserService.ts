// src/services/UserService.ts
import API from './api';

export interface UserProfile {
    id: number;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    identifier?: string;
    legal_representative?: string;
    client_type?: string;
    policy_accepted: boolean;
}

export interface UserProfileResponse {
    success: boolean;
    data: UserProfile;
    message: string;
}

export const UserService = {
    /**
     * Obtiene el perfil del usuario actual
     * @param token - Token de autenticación
     * @returns Perfil del usuario
     */
    async getProfile(token: string): Promise<UserProfile> {
        try {
            console.log('🔍 UserService - Obteniendo perfil del usuario');
            
            const response = await API.get('/api/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Log removed
            return response.data.data;
        } catch (error: any) {
            // Error log removed
            throw new Error(error.response?.data?.message || 'Error obteniendo perfil del usuario');
        }
    },

    /**
     * Valida si el token es válido y retorna el perfil del usuario
     * @param token - Token a validar
     * @returns Perfil del usuario si el token es válido, null si no lo es
     */
    async validateToken(token: string): Promise<UserProfile | null> {
        try {
            const profile = await this.getProfile(token);
            return profile;
        } catch (error) {
            // Log removed
            return null;
        }
    }
};
