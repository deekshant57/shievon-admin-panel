import { Location, Shop } from '@/types';

const EARTH_RADIUS_KM = 6371;

type CoordSource = {
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
} | null | undefined;

export function parseCoordinate(
  value: number | string | null | undefined,
): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed =
    typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

/** Great-circle distance in kilometers (Haversine). */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getLocationCoordinates(
  location?: Location | CoordSource | null,
): { lat: number; lng: number } | null {
  if (!location || typeof location !== 'object') {
    return null;
  }

  const lat = parseCoordinate(
    (location as CoordSource)?.lat ?? (location as CoordSource)?.latitude,
  );
  const lng = parseCoordinate(
    (location as CoordSource)?.lng ?? (location as CoordSource)?.longitude,
  );
  if (lat == null || lng == null) {
    return null;
  }

  return { lat, lng };
}

/**
 * Resolve shop pickup coordinates from settings.location and/or address.
 * Shops may store lat/lng on either field depending on how they were saved.
 */
export function getShopCoordinates(
  shop?: Shop | null,
): { lat: number; lng: number } | null {
  if (!shop) {
    return null;
  }

  const settings =
    typeof shop.settings === 'string'
      ? (() => {
          try {
            return JSON.parse(shop.settings as unknown as string);
          } catch {
            return null;
          }
        })()
      : shop.settings;

  const address =
    typeof shop.address === 'string'
      ? (() => {
          try {
            return JSON.parse(shop.address as unknown as string);
          } catch {
            return null;
          }
        })()
      : shop.address;

  return (
    getLocationCoordinates(settings?.location as CoordSource) ??
    getLocationCoordinates(address as CoordSource)
  );
}

export function formatDistanceKm(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }

  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}
