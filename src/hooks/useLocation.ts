import { useState, useCallback } from 'react';
import { getCurrentLocation } from '../services/location/locationService';
import type { UserLocation } from '../types';

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
      } else {
        setError('No se pudo obtener la ubicacion. Comprueba los permisos.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Error de ubicacion');
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, requestLocation };
}
