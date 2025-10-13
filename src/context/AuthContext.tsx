// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import API, { login as loginAPI } from '../services/api';
import { useError } from './ErrorContext';
import { StorageService, StoredUserData } from '../services/StorageService';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';

type User = {
  id: number;
  name: string;
  role: 'cliente' | 'tecnico' | 'coordinador' | 'administrador';
  email: string;
  phone: string;
  address: string;
  city: string;
  identifier: string;
  legal_representative: string;
  client_type: 'persona' | 'empresa';
  policy_accepted?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  acceptPolicy: () => Promise<void>;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { showError } = useError();

  // Inicialización automática al cargar la app
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔍 AuthContext - Inicializando autenticación...');
      setIsLoading(true);

      const { token: storedToken, userData: storedUserData } = await StorageService.getAuthData();

      if (storedToken && storedUserData) {
        console.log('🔍 AuthContext - Datos encontrados, validando token...');
        
        // Validar que el token sigue siendo válido
        const isValid = await UserService.validateToken(storedToken);
        
        if (isValid) {
          console.log('✅ AuthContext - Token válido, restaurando sesión');
          setToken(storedToken);
          setUser(storedUserData as User);
          API.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          console.log('🔄 AuthContext - Token expirado, intentando renovar automáticamente...');
          
          // Intentar renovar token automáticamente
          const refreshResult = await AuthService.refreshToken();
          
          if (refreshResult?.success && refreshResult.data) {
            console.log('✅ AuthContext - Token renovado automáticamente');
            const { token: newToken, user: newUser } = refreshResult.data;
            
            // Guardar nuevos datos
            await StorageService.saveToken(newToken);
            await StorageService.saveUserData(newUser as StoredUserData);
            
            setToken(newToken);
            setUser(newUser as User);
            API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          } else {
            console.log('❌ AuthContext - No se pudo renovar token, limpiando datos');
            await StorageService.clearAuthData();
          }
        }
      } else {
        console.log('ℹ️ AuthContext - No hay datos de autenticación guardados');
      }
    } catch (error) {
      console.error('❌ AuthContext - Error inicializando autenticación:', error);
      // En caso de error, limpiar datos
      await StorageService.clearAuthData();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log('🔍 AuthContext - Iniciando login...');
      const { token: newToken, user: userData } = await loginAPI(email, password);

      // Guardar datos en storage
      await StorageService.saveToken(newToken);
      await StorageService.saveUserData(userData as StoredUserData);
      
      // Guardar credenciales para refresh automático
      await AuthService.saveCredentials(email, password);

      setToken(newToken);
      setUser(userData);

      // Configurar token en todas las peticiones de Axios
      API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      console.log('✅ AuthContext - Login exitoso');
      return userData;
    } catch (error) {
      console.error('❌ AuthContext - Error en login:', error);
      showError(error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🔍 AuthContext - Cerrando sesión...');
      
      // Limpiar todos los datos del storage (incluyendo credenciales)
      await StorageService.clearAllAuthData();
      
      // Limpiar estado
      setUser(null);
      setToken(null);
      delete API.defaults.headers.common['Authorization'];
      
      console.log('✅ AuthContext - Sesión cerrada');
    } catch (error) {
      console.error('❌ AuthContext - Error cerrando sesión:', error);
      // Aún así limpiar el estado local
      setUser(null);
      setToken(null);
      delete API.defaults.headers.common['Authorization'];
    }
  };

  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      console.log('🔍 AuthContext - Actualizando datos del usuario...');
      const userProfile = await UserService.getProfile(token);
      
      // Actualizar datos guardados
      await StorageService.saveUserData(userProfile as StoredUserData);
      setUser(userProfile as User);
      
      console.log('✅ AuthContext - Datos del usuario actualizados');
    } catch (error) {
      console.error('❌ AuthContext - Error actualizando datos del usuario:', error);
      // Si hay error, podría ser que el token expiró
      await logout();
    }
  };

  const acceptPolicy = async () => {
    if (!token) throw new Error('No hay token de autenticación');

    await API.post('api/acceptPolicy');
    setUser((prev) => prev ? { ...prev, policy_accepted: true } : prev);
  };

  return (
      <AuthContext.Provider value={{ 
        user, 
        token, 
        isLoading, 
        isInitialized, 
        login, 
        logout, 
        acceptPolicy, 
        refreshUserData 
      }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
