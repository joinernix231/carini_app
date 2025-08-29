// context/AuthContext.tsx
import React, { createContext, useState, useContext } from 'react';
import API, { login as loginAPI } from '../services/api';

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
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  acceptPolicy: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<User> => {
    const { token: newToken, user: userData } = await loginAPI(email, password);

    setToken(newToken);
    setUser(userData);

    // Configurar token en todas las peticiones de Axios
    API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    return userData;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    delete API.defaults.headers.common['Authorization'];
  };

  const acceptPolicy = async () => {
    if (!token) throw new Error('No hay token de autenticación');

    await API.post('api/acceptPolicy');
    setUser((prev) => prev ? { ...prev, policy_accepted: true } : prev);
  };

  return (
      <AuthContext.Provider value={{ user, token, login, logout, acceptPolicy }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
