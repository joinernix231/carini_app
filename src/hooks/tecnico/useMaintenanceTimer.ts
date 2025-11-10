import { useState, useEffect } from 'react';

interface UseMaintenanceTimerReturn {
  elapsedTime: number;
  formattedTime: string;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Hook para manejar el timer de un mantenimiento en progreso
 * Calcula el tiempo transcurrido desde started_at
 */
// totalPausedMs: tiempo total pausado acumulado (en milisegundos)
export function useMaintenanceTimer(
  startedAt?: string,
  totalPausedMs: number = 0
): UseMaintenanceTimerReturn {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const workingMs = Math.max(0, (now - startTime) - (totalPausedMs || 0));
      setElapsedTime(workingMs);
    };

    // Actualizar inmediatamente
    updateTimer();

    // Actualizar cada segundo
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt, totalPausedMs]);

  // Calcular horas, minutos y segundos
  const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
  const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);

  // Formatear como HH:MM:SS
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return {
    elapsedTime,
    formattedTime,
    hours,
    minutes,
    seconds,
  };
}


