import React, { createContext, useState, useContext } from 'react';
import { login as loginAPI } from '../services/api';
import API from '../services/api'; // 👈 Importamos tu instancia de Axios configurada

type User = {
  id: number;
  name: string;
  role: 'cliente' | 'tecnico' | 'coordinador';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const response = await loginAPI(email, password);
    setToken(response.token);
    setUser(response.user);

    // 🛡️ Muy importante: Configurar el token por defecto en Axios
    API.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    // Eliminar el Authorization global
    delete API.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};