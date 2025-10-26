import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { getEquiposVinculados } from '../../services/EquipoClienteService';

export interface ClienteEquipo {
  id: string;
  name: string;
  tipo_equipo: string;
  serial?: string;
  model?: string;
  address?: string;
  estado?: string;
  ultimoMantenimiento?: string;
}

export const useClienteEquipos = () => {
  const { token } = useAuth();
  const { showError } = useError();
  const [equipos, setEquipos] = useState<ClienteEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEquipos = async () => {
    try {
      setLoading(true);
      const equiposData = await getEquiposVinculados(token || '');
      
      const listaEquipos = equiposData.map((item: any) => {
        const { device, address, id } = item;
        return {
          id,
          name: `${device.model} - ${address}`,
          tipo_equipo: device.type,
          serial: device.serial,
          model: device.model,
          address,
          estado: 'Activo',
          ultimoMantenimiento: '2024-01-15'
        };
      });
      
      setEquipos(listaEquipos);
    } catch (error) {
      // Error log removed
      showError('Error cargando equipos');
    } finally {
      setLoading(false);
    }
  };

  const refreshEquipos = async () => {
    try {
      setRefreshing(true);
      await loadEquipos();
    } catch (error) {
      // Error log removed
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadEquipos();
    }
  }, [token]);

  return {
    equipos,
    loading,
    refreshing,
    refresh: refreshEquipos,
    reload: loadEquipos
  };
};


