import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function getLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          if (isMounted) {
            // En web o si no hay permisos, usar ubicación por defecto (Valencia, España)
            setLocation({
              latitude: 39.4699,
              longitude: -0.3763,
              error: 'Using default location (Valencia, Spain)',
              loading: false,
            });
          }
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            error: null,
            loading: false,
          });
        }
      } catch (error) {
        if (isMounted) {
          // Si falla (común en web), usar ubicación por defecto
          setLocation({
            latitude: 39.4699,
            longitude: -0.3763,
            error: 'Using default location (Valencia, Spain)',
            loading: false,
          });
        }
      }
    }

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = async () => {
    setLocation((prev) => ({ ...prev, loading: true }));

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        error: null,
        loading: false,
      });
    } catch (error) {
      setLocation({
        latitude: null,
        longitude: null,
        error: 'Failed to get location',
        loading: false,
      });
    }
  };

  return { ...location, refresh };
}




