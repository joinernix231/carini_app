import axios from 'axios';

// Crear instancia principal de Axios
const API = axios.create({
  baseURL: 'https://cariniservice-production.up.railway.app/', 
//  baseURL: 'http://127.0.0.1:8500', 
  timeout: 5000, // ⏳ Máximo tiempo de espera para cada request (10s)
});

// Interceptor de respuesta para controlar errores automáticamente
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en la API:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Función de login usando la instancia API
export const login = async (email: string, password: string) => {
  const response = await API.post('/login', { email, password });
  return response.data.data; 
};

export default API;
