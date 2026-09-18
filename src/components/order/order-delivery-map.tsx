import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { format } from 'date-fns';
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from '@react-google-maps/api';
import { DeliveryPilotLocation } from '@/types';

type LatLngPoint = {
  lat: number;
  lng: number;
};

type OrderDeliveryMapProps = {
  pilotLocation: DeliveryPilotLocation;
  shopLocation?: LatLngPoint | null;
  riderName?: string | null;
};

const libraries: ('places')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

function formatUpdatedAt(value: string) {
  try {
    return format(new Date(value), 'MMMM d, yyyy h:mm a');
  } catch {
    return value;
  }
}

function toLatLngPoint(
  lat: number | string | null | undefined,
  lng: number | string | null | undefined,
): LatLngPoint | null {
  const parsedLat = typeof lat === 'number' ? lat : Number(lat);
  const parsedLng = typeof lng === 'number' ? lng : Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return null;
  }
  return { lat: parsedLat, lng: parsedLng };
}

function svgMarkerIcon(color: string, label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <path fill="${color}" stroke="#fff" stroke-width="2"
        d="M20 2C11.7 2 5 8.7 5 17c0 11.2 15 29 15 29s15-17.8 15-29C35 8.7 28.3 2 20 2z"/>
      <circle cx="20" cy="17" r="7" fill="#fff"/>
      <text x="20" y="21" text-anchor="middle" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="${color}">${label}</text>
    </svg>
  `.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 40, height: 48 } as google.maps.Size,
    anchor: { x: 20, y: 48 } as google.maps.Point,
  };
}

function EmbedFallback({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title: string;
}) {
  const embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <iframe
      title={title}
      src={embedUrl}
      className="h-full w-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}

/**
 * Vendor pickup tracking map — Blinkit-style live view of rider approaching the shop.
 * Customer dropoff tracking belongs on the customer app, not the vendor portal.
 */
export default function OrderDeliveryMap({
  pilotLocation,
  shopLocation,
  riderName,
}: OrderDeliveryMapProps) {
  const { t } = useTranslation('common');
  const riderPoint = useMemo(
    () => toLatLngPoint(pilotLocation.latitude, pilotLocation.longitude),
    [pilotLocation.latitude, pilotLocation.longitude],
  );
  const shopPoint = useMemo(
    () =>
      shopLocation
        ? toLatLngPoint(shopLocation.lat, shopLocation.lng)
        : null,
    [shopLocation],
  );

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const hasFittedRef = useRef(false);
  const fitKey = `${shopPoint?.lat ?? ''}:${shopPoint?.lng ?? ''}`;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google_map_autocomplete',
    googleMapsApiKey: apiKey || '',
    libraries,
    version: 'weekly',
  });

  const routePath = useMemo(() => {
    if (!riderPoint || !shopPoint) {
      return [] as LatLngPoint[];
    }
    return [riderPoint, shopPoint];
  }, [riderPoint, shopPoint]);

  const fitPoints = useMemo(() => {
    const points: LatLngPoint[] = [];
    if (riderPoint) {
      points.push(riderPoint);
    }
    if (shopPoint) {
      points.push(shopPoint);
    }
    return points;
  }, [riderPoint, shopPoint]);

  const shopIcon = useMemo(() => svgMarkerIcon('#16a34a', 'S'), []);
  const riderIcon = useMemo(() => svgMarkerIcon('#ea580c', 'R'), []);

  const polylineOptions = useMemo(
    () => ({
      strokeColor: '#ea580c',
      strokeOpacity: 1,
      strokeWeight: 5,
      geodesic: true,
      zIndex: 1,
      clickable: false,
      visible: true,
    }),
    [],
  );

  const onLoad = useCallback((nextMap: google.maps.Map) => {
    setMap(nextMap);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    hasFittedRef.current = false;
  }, []);

  useEffect(() => {
    hasFittedRef.current = false;
  }, [fitKey]);

  useEffect(() => {
    if (!map || !window.google?.maps || fitPoints.length === 0) {
      return;
    }

    if (!hasFittedRef.current) {
      hasFittedRef.current = true;

      if (fitPoints.length === 1) {
        map.setCenter(fitPoints[0]);
        map.setZoom(15);
        return;
      }

      const bounds = new google.maps.LatLngBounds();
      fitPoints.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, 72);

      const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom != null && zoom > 16) {
          map.setZoom(16);
        }
      });

      return () => {
        google.maps.event.removeListener(listener);
      };
    }

    if (!riderPoint) {
      return;
    }

    const bounds = map.getBounds();
    if (bounds && !bounds.contains(riderPoint)) {
      map.panTo(riderPoint);
    }
  }, [map, fitPoints, riderPoint]);

  if (!riderPoint) {
    return null;
  }

  const mapsUrl = shopPoint
    ? `https://www.google.com/maps/dir/?api=1&origin=${riderPoint.lat},${riderPoint.lng}&destination=${shopPoint.lat},${shopPoint.lng}`
    : `https://www.google.com/maps?q=${riderPoint.lat},${riderPoint.lng}`;

  const title = riderName
    ? `${t('text-rider-location')}: ${riderName}`
    : t('text-rider-location');

  const canUseInteractiveMap = Boolean(apiKey?.trim()) && isLoaded && !loadError;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border-200">
        <div className="relative h-64 w-full md:h-80">
          {canUseInteractiveMap ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={riderPoint}
              zoom={14}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                fullscreenControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                clickableIcons: false,
                gestureHandling: 'greedy',
              }}
            >
              {shopPoint ? (
                <Marker
                  position={shopPoint}
                  title={t('text-map-shop-pickup')}
                  icon={shopIcon}
                  zIndex={2}
                />
              ) : null}

              <Marker
                position={riderPoint}
                title={
                  riderName
                    ? `${t('text-map-rider')}: ${riderName}`
                    : t('text-map-rider')
                }
                icon={riderIcon}
                zIndex={3}
              />

              {routePath.length > 1 ? (
                <Polyline
                  key={`route-${routePath[0].lat}-${routePath[0].lng}-${routePath[1].lat}-${routePath[1].lng}`}
                  path={routePath}
                  options={polylineOptions}
                />
              ) : null}
            </GoogleMap>
          ) : (
            <EmbedFallback
              latitude={riderPoint.lat}
              longitude={riderPoint.lng}
              title={title}
            />
          )}
        </div>

        {canUseInteractiveMap ? (
          <div className="flex flex-wrap gap-3 border-t border-border-200 bg-gray-50 px-3 py-2 text-xs text-body">
            {shopPoint ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                {t('text-map-shop-pickup')}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
              {t('text-map-rider')}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-body">
        <span>
          {t('text-rider-last-updated')}:{' '}
          {formatUpdatedAt(pilotLocation.updated_at)}
        </span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:text-accent-hover"
        >
          {t('text-open-in-maps')}
        </a>
      </div>
    </div>
  );
}
