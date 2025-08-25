import axios from 'axios';


const API = axios.create({
     baseURL: 'https://cariniservice-production.up.railway.app/',
    timeout: 5000,
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Error en la API:', error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const login = async (email: string, password: string) => {
    const response = await API.post('/login', { email, password });
    return response.data.data;
};

export const acceptPolicy = async () => {
    const response = await API.post('api/acceptPolicy');
    return response.data;
};

export default API;
