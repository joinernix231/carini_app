
import API from './api';

export const getEmpresaInfo = async (token: string) => {
  const response = await API.get('api/my-company', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data.data;
};

export const updateEmpresaInfo = async (token: string, payload: any) => {
  const response = await API.put('api/my-company', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};
