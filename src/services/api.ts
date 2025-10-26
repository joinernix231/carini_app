import axios from 'axios';
import { ErrorService } from './ErrorService';
import { ApiError } from '../types/ErrorTypes';
import { logger } from '../utils/logger';

const API = axios.create({
     baseURL: 'http://192.168.2.3:8500/',
    timeout: 5000,
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const apiError = ErrorService.parseApiError(error);
        const errorType = ErrorService.getErrorType(apiError.status, error);
        const config = ErrorService.getErrorConfig(errorType);
        
        logger.error('Error en la API:', {
            status: apiError.status,
            message: apiError.message,
            type: errorType,
            originalError: error
        });

        // Agregar información adicional al error para el manejo posterior
        error.apiError = apiError;
        error.errorType = errorType;
        error.errorConfig = config;
        
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

export const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

export default API;
