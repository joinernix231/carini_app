// src/services/UserService.ts
import API from './api';

export interface UserProfile {
    id: number;
    name: string;
    role: string;
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

            console.log('✅ UserService - Perfil obtenido:', response.data);
            return response.data.data;
        } catch (error: any) {
            console.error('❌ UserService - Error obteniendo perfil:', error);
            throw new Error(error.response?.data?.message || 'Error obteniendo perfil del usuario');
        }
    },

    /**
     * Valida si el token es válido
     * @param token - Token a validar
     * @returns true si el token es válido
     */
    async validateToken(token: string): Promise<boolean> {
        try {
            await this.getProfile(token);
            return true;
        } catch (error) {
            console.log('❌ UserService - Token inválido');
            return false;
        }
    }
};
