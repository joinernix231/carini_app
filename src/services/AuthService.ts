// src/services/AuthService.ts
import API from './api';
import { StorageService } from './StorageService';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        token: string;
        user: {
            id: number;
            name: string;
            role: string;
            policy_accepted: boolean;
        };
    };
    message: string;
}

export const AuthService = {
    /**
     * Realiza login con credenciales
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            console.log('🔍 AuthService - Realizando login...');
            
            const response = await API.post('/login', {
                email,
                password
            });

            console.log('✅ AuthService - Login exitoso');
            return response.data;
        } catch (error: any) {
            console.error('❌ AuthService - Error en login:', error);
            throw new Error(error.response?.data?.message || 'Error en el login');
        }
    },

    /**
     * Guarda las credenciales de forma segura
     */
    async saveCredentials(email: string, password: string): Promise<void> {
        try {
            // Encriptar credenciales (en producción usar una librería de encriptación)
            const credentials = {
                email,
                password: btoa(password), // Base64 encoding (básico)
                timestamp: Date.now()
            };

            await StorageService.saveCredentials(credentials);
            console.log('✅ AuthService - Credenciales guardadas');
        } catch (error) {
            console.error('❌ AuthService - Error guardando credenciales:', error);
            throw new Error('Error guardando credenciales');
        }
    },

    /**
     * Obtiene las credenciales guardadas
     */
    async getStoredCredentials(): Promise<LoginCredentials | null> {
        try {
            const credentials = await StorageService.getCredentials();
            if (!credentials) return null;

            // Desencriptar password
            const password = atob(credentials.password);
            
            return {
                email: credentials.email,
                password
            };
        } catch (error) {
            console.error('❌ AuthService - Error obteniendo credenciales:', error);
            return null;
        }
    },

    /**
     * Intenta renovar el token automáticamente
     */
    async refreshToken(): Promise<LoginResponse | null> {
        try {
            console.log('🔄 AuthService - Intentando renovar token...');
            
            const credentials = await this.getStoredCredentials();
            if (!credentials) {
                console.log('ℹ️ AuthService - No hay credenciales guardadas');
                return null;
            }

            // Intentar login automático
            const loginResponse = await this.login(credentials.email, credentials.password);
            
            console.log('✅ AuthService - Token renovado automáticamente');
            return loginResponse;
        } catch (error) {
            console.error('❌ AuthService - Error renovando token:', error);
            return null;
        }
    },

    /**
     * Limpia las credenciales guardadas
     */
    async clearCredentials(): Promise<void> {
        try {
            await StorageService.clearCredentials();
            console.log('✅ AuthService - Credenciales limpiadas');
        } catch (error) {
            console.error('❌ AuthService - Error limpiando credenciales:', error);
        }
    }
};
