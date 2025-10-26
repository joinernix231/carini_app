// src/services/StorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    AUTH_TOKEN: '@carini_auth_token',
    USER_DATA: '@carini_user_data',
    LOGIN_TIMESTAMP: '@carini_login_timestamp',
    CREDENTIALS: '@carini_credentials'
} as const;

export interface StoredUserData {
    id: number;
    name: string;
    role: string;
    policy_accepted: boolean;
}

export interface StoredCredentials {
    email: string;
    password: string;
    timestamp: number;
}

export const StorageService = {
    /**
     * Guarda el token de autenticación
     */
    async saveToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            // Log removed
        } catch (error) {
            // Error log removed
            throw new Error('Error guardando token de autenticación');
        }
    },

    /**
     * Obtiene el token guardado
     */
    async getToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            return token;
        } catch (error) {
            // Error log removed
            return null;
        }
    },

    /**
     * Guarda los datos del usuario
     */
    async saveUserData(userData: StoredUserData): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
            await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now().toString());
            // Log removed
        } catch (error) {
            // Error log removed
            throw new Error('Error guardando datos de usuario');
        }
    },

    /**
     * Obtiene los datos del usuario guardados
     */
    async getUserData(): Promise<StoredUserData | null> {
        try {
            const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            // Error log removed
            return null;
        }
    },

    /**
     * Obtiene el timestamp del login
     */
    async getLoginTimestamp(): Promise<number | null> {
        try {
            const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TIMESTAMP);
            return timestamp ? parseInt(timestamp) : null;
        } catch (error) {
            // Error log removed
            return null;
        }
    },

    /**
     * Verifica si el usuario está logueado
     */
    async isLoggedIn(): Promise<boolean> {
        try {
            const token = await this.getToken();
            const userData = await this.getUserData();
            return !!(token && userData);
        } catch (error) {
            // Error log removed
            return false;
        }
    },

    /**
     * Limpia todos los datos de autenticación
     */
    async clearAuthData(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.AUTH_TOKEN,
                STORAGE_KEYS.USER_DATA,
                STORAGE_KEYS.LOGIN_TIMESTAMP
            ]);
            // Log removed
        } catch (error) {
            // Error log removed
            throw new Error('Error cerrando sesión');
        }
    },

    /**
     * Obtiene todos los datos de autenticación
     */
    async getAuthData(): Promise<{
        token: string | null;
        userData: StoredUserData | null;
        loginTimestamp: number | null;
    }> {
        try {
            const [token, userData, loginTimestamp] = await Promise.all([
                this.getToken(),
                this.getUserData(),
                this.getLoginTimestamp()
            ]);

            return {
                token,
                userData,
                loginTimestamp
            };
        } catch (error) {
            // Error log removed
            return {
                token: null,
                userData: null,
                loginTimestamp: null
            };
        }
    },

    /**
     * Guarda las credenciales del usuario
     */
    async saveCredentials(credentials: StoredCredentials): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
            // Log removed
        } catch (error) {
            // Error log removed
            throw new Error('Error guardando credenciales');
        }
    },

    /**
     * Obtiene las credenciales guardadas
     */
    async getCredentials(): Promise<StoredCredentials | null> {
        try {
            const credentials = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
            return credentials ? JSON.parse(credentials) : null;
        } catch (error) {
            // Error log removed
            return null;
        }
    },

    /**
     * Limpia las credenciales guardadas
     */
    async clearCredentials(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
            // Log removed
        } catch (error) {
            // Error log removed
        }
    },

    /**
     * Limpia todos los datos de autenticación incluyendo credenciales
     */
    async clearAllAuthData(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.AUTH_TOKEN,
                STORAGE_KEYS.USER_DATA,
                STORAGE_KEYS.LOGIN_TIMESTAMP,
                STORAGE_KEYS.CREDENTIALS
            ]);
            // Log removed
        } catch (error) {
            // Error log removed
            throw new Error('Error cerrando sesión');
        }
    }
};
