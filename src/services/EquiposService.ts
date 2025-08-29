import API from './api';


export const getEquiposVinculados = async (token: string) => {
  const response = await API.get('/api/devices', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data.data; // acceder al array
};


export const asignarEquipo = async (payload: {
  serial: string;
  address: string;
  client_id: number;
}, token: string) => {
  const response = await API.post('/api/devices', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

