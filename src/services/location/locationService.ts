import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import type { UserLocation, NearbyStore } from '../../types';

const LOCATION_KEY = 'user_location';
const LOCATION_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Request location permissions and get current position.
 * Caches the result for 30 minutes to avoid excessive GPS usage.
 */
export async function getCurrentLocation(): Promise<UserLocation | null> {
  // Check cache first
  const cached = await getCachedLocation();
  if (cached) return cached;

  // Request permissions
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const userLoc: UserLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Reverse geocode for city/postal code
    try {
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
      });
      if (geo) {
        userLoc.city = geo.city ?? undefined;
        userLoc.postal_code = geo.postalCode ?? undefined;
      }
    } catch {
      // Reverse geocode failed — location is still usable
    }

    // Cache it
    await cacheLocation(userLoc);
    return userLoc;
  } catch {
    return null;
  }
}

/**
 * Get cached location if still valid.
 */
async function getCachedLocation(): Promise<UserLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const { location, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > LOCATION_TTL) return null;
    return location;
  } catch {
    return null;
  }
}

async function cacheLocation(location: UserLocation): Promise<void> {
  await AsyncStorage.setItem(
    LOCATION_KEY,
    JSON.stringify({ location, timestamp: Date.now() }),
  );
}

/**
 * Find nearby stores using Supabase RPC (Haversine function in DB).
 */
export async function findNearbyStores(
  location: UserLocation,
  radiusKm: number = 10,
): Promise<NearbyStore[]> {
  try {
    const { data, error } = await supabase.rpc('nearby_stores', {
      user_lat: location.latitude,
      user_lng: location.longitude,
      radius_km: radiusKm,
    });

    if (error) return [];

    return (data || []).map((s: any) => ({
      store_id: s.store_id,
      store_name: s.store_name,
      distance_km: s.distance_km,
      address: s.address || '',
      offers_count: s.offers_count || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula).
 */
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
