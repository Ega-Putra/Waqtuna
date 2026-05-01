import { Magnetometer, type MagnetometerMeasurement } from 'expo-sensors';
import { useEffect, useMemo, useState } from 'react';

import { getInitialLocationState, getLocationLabel, type StoredCoordinates } from '@/shared/utils/location';

const kaabaCoordinates = {
  latitude: 21.4225,
  longitude: 39.8262,
};

export type QiblaDirectionState = {
  qiblaBearing: number;
  deviceHeading: number;
  qiblaRelativeAngle: number;
  cityName: string;
  accuracy: number | null;
  isLoading: boolean;
  isSensorAvailable: boolean;
  errorMessage: string | null;
};

export function useQiblaDirection(): QiblaDirectionState {
  const [coordinates, setCoordinates] = useState<StoredCoordinates | null>(null);
  const [cityName, setCityName] = useState('Mengambil lokasi...');
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSensorAvailable, setIsSensorAvailable] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLocation() {
      try {
        const locationState = await getInitialLocationState();
        const resolvedCoordinates = locationState.coordinates ?? {
          latitude: locationState.city.latitude,
          longitude: locationState.city.longitude,
        };

        if (!isMounted) {
          return;
        }

        setCoordinates(resolvedCoordinates);
        setCityName(getLocationLabel(locationState.city));

        if (!locationState.coordinates) {
          setErrorMessage('Lokasi perangkat belum tersedia. Arah dihitung dari kota pilihan.');
        }
      } catch {
        if (isMounted) {
        setErrorMessage('Tidak dapat mengambil lokasi. Pastikan GPS aktif.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    async function subscribeToMagnetometer() {
      try {
        const isAvailable = await Magnetometer.isAvailableAsync();

        if (!isMounted) {
          return;
        }

        setIsSensorAvailable(isAvailable);

        if (!isAvailable) {
          setErrorMessage((currentMessage) =>
            currentMessage ?? 'Sensor kompas tidak tersedia di perangkat ini'
          );
          return;
        }

        Magnetometer.setUpdateInterval(220);
        subscription = Magnetometer.addListener((measurement) => {
          if (!isMounted) {
            return;
          }

          setDeviceHeading((currentHeading) =>
            smoothHeading(currentHeading, calculateHeading(measurement))
          );
          setAccuracy(estimateMagnetometerAccuracy(measurement));
        });
      } catch {
        if (isMounted) {
          setIsSensorAvailable(false);
          setErrorMessage((currentMessage) =>
            currentMessage ?? 'Sensor kompas tidak tersedia di perangkat ini'
          );
        }
      }
    }

    void subscribeToMagnetometer();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  const qiblaBearing = useMemo(() => {
    if (!coordinates) {
      return 0;
    }

    return calculateQiblaBearing(coordinates);
  }, [coordinates]);

  return {
    qiblaBearing,
    deviceHeading,
    qiblaRelativeAngle: normalizeDegrees(qiblaBearing - deviceHeading),
    cityName,
    accuracy,
    isLoading,
    isSensorAvailable,
    errorMessage,
  };
}

function calculateQiblaBearing(coordinates: StoredCoordinates) {
  const lat1 = toRadians(coordinates.latitude);
  const lat2 = toRadians(kaabaCoordinates.latitude);
  const deltaLongitude = toRadians(kaabaCoordinates.longitude - coordinates.longitude);

  const y = Math.sin(deltaLongitude) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLongitude);
  const bearing = radiansToDegrees(Math.atan2(y, x));

  return normalizeDegrees(bearing);
}

function calculateHeading({ x, y }: MagnetometerMeasurement) {
  const rawAngle = radiansToDegrees(Math.atan2(y, x));

  return normalizeDegrees(90 - rawAngle);
}

function smoothHeading(currentHeading: number, nextHeading: number) {
  const shortestDelta = normalizeDegrees(nextHeading - currentHeading + 180) - 180;

  return normalizeDegrees(currentHeading + shortestDelta * 0.22);
}

function estimateMagnetometerAccuracy({ x, y, z }: MagnetometerMeasurement) {
  const magneticFieldStrength = Math.sqrt(x * x + y * y + z * z);

  if (magneticFieldStrength >= 25 && magneticFieldStrength <= 65) {
    return 3;
  }

  if (magneticFieldStrength >= 15 && magneticFieldStrength <= 85) {
    return 2;
  }

  return 1;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI;
}
