import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { indonesiaCities, type IndonesiaCity } from '@/constants/indonesia-cities';

const INITIAL_COORDINATES_KEY = 'waqtuna.initial-coordinates';
const LOCATION_REQUESTED_KEY = 'waqtuna.location-requested';
const SELECTED_CITY_CODE_KEY = 'waqtuna.selected-city-code';
const DEFAULT_CITY_CODE = '35.78';

export type StoredCoordinates = {
  latitude: number;
  longitude: number;
};

export type InitialLocationState = {
  city: IndonesiaCity;
  coordinates: StoredCoordinates | null;
};

export const defaultIndonesiaCity =
  indonesiaCities.find((city) => city.code === DEFAULT_CITY_CODE) ?? indonesiaCities[0];

export async function getInitialLocationState(): Promise<InitialLocationState> {
  const [storedCoordinatesRaw, selectedCityCode, locationRequested] = await Promise.all([
    AsyncStorage.getItem(INITIAL_COORDINATES_KEY),
    AsyncStorage.getItem(SELECTED_CITY_CODE_KEY),
    AsyncStorage.getItem(LOCATION_REQUESTED_KEY),
  ]);

  let coordinates = parseStoredCoordinates(storedCoordinatesRaw);

  if (!coordinates && locationRequested !== 'true') {
    await AsyncStorage.setItem(LOCATION_REQUESTED_KEY, 'true');

    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status === 'granted') {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      await AsyncStorage.setItem(INITIAL_COORDINATES_KEY, JSON.stringify(coordinates));
    }
  }

  const selectedCity = selectedCityCode ? findCityByCode(selectedCityCode) : null;
  const nearestCity = coordinates ? findNearestCity(coordinates) : null;

  return {
    city: selectedCity ?? nearestCity ?? defaultIndonesiaCity,
    coordinates,
  };
}

export function findCityByCode(code: string) {
  return indonesiaCities.find((city) => city.code === code) ?? null;
}

export async function persistSelectedCityCode(code: string) {
  await AsyncStorage.setItem(SELECTED_CITY_CODE_KEY, code);
}

export function searchIndonesiaCities(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return indonesiaCities;
  }

  return indonesiaCities.filter((city) => {
    const cityName = city.city.toLowerCase();
    const provinceName = city.province.toLowerCase();

    return cityName.includes(normalizedQuery) || provinceName.includes(normalizedQuery);
  });
}

export function getLocationLabel(city: IndonesiaCity) {
  return `${compactCityName(city.city)}, IDN`;
}

export function findNearestCity(coordinates: StoredCoordinates) {
  let nearestCity = defaultIndonesiaCity;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const city of indonesiaCities) {
    const distance = getDistanceInKm(
      coordinates.latitude,
      coordinates.longitude,
      city.latitude,
      city.longitude
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
}

function parseStoredCoordinates(rawValue: string | null): StoredCoordinates | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredCoordinates>;

    if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function compactCityName(cityName: string) {
  if (cityName.startsWith('Kota ')) {
    return cityName.replace(/^Kota\s+/, '');
  }

  if (cityName.startsWith('Kabupaten ')) {
    return cityName.replace(/^Kabupaten\s+/, 'Kab. ');
  }

  return cityName;
}

function getDistanceInKm(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number
) {
  const earthRadius = 6371;
  const latitudeDelta = toRadians(endLatitude - startLatitude);
  const longitudeDelta = toRadians(endLongitude - startLongitude);
  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(startLatitude)) *
      Math.cos(toRadians(endLatitude)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
