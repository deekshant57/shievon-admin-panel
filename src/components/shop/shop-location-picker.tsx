import GooglePlacesAutocomplete from '@/components/form/google-places-autocomplete';
import Button from '@/components/ui/button';
import Loader from '@/components/ui/loader/loader';
import { GoogleMapLocation } from '@/types';
import { getLocation } from '@/utils/use-location';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useTranslation } from 'next-i18next';
import { useEffect, useMemo, useRef, useState } from 'react';

const libraries: ('places')[] = ['places'];

const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 };
const OVERVIEW_ZOOM = 5;
const STREET_ZOOM = 17;
const MIN_ZOOM = 14;
const MAX_ZOOM = 19;
const ROUGH_ACCURACY_METERS = 100;
const PIN_ICON_URL =
  'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png';
const MAPS_AUTH_FAILURE_EVENT = 'shop-maps-auth-failure';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

type LatLng = {
  lat: number;
  lng: number;
};

export type ShopLocationPick = GoogleMapLocation & {
  addressResolved?: boolean;
  pinAdjusted?: boolean;
};

type ShopLocationPickerProps = {
  latitude?: number | string | null;
  longitude?: number | string | null;
  formattedAddress?: string;
  entranceConfirmed?: boolean;
  onChange: (location: ShopLocationPick) => void;
};

type MapsWindow = Window & {
  gm_authFailure?: () => void;
  __shopMapsAuthHooked?: boolean;
};

function hookMapsAuthFailure() {
  if (typeof window === 'undefined') return;
  const mapsWindow = window as MapsWindow;
  if (mapsWindow.__shopMapsAuthHooked) return;
  mapsWindow.__shopMapsAuthHooked = true;
  const previous = mapsWindow.gm_authFailure;
  mapsWindow.gm_authFailure = () => {
    previous?.();
    window.dispatchEvent(new Event(MAPS_AUTH_FAILURE_EVENT));
  };
}

hookMapsAuthFailure();

function parseCoord(value: unknown): number | null {
  if (value === '' || value == null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function samePoint(point: LatLng | null, lat: number, lng: number) {
  if (!point) return false;
  return (
    Math.abs(point.lat - lat) < 0.00001 && Math.abs(point.lng - lng) < 0.00001
  );
}

function withPinCoordinates(
  location: GoogleMapLocation,
  lat: number,
  lng: number,
): GoogleMapLocation {
  return {
    ...location,
    lat,
    lng,
  };
}

function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GoogleMapLocation | null> {
  return new Promise((resolve) => {
    if (typeof google === 'undefined' || !google.maps?.Geocoder) {
      resolve(null);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        resolve(withPinCoordinates(getLocation(results[0]), lat, lng));
        return;
      }
      resolve(null);
    });
  });
}

function mapAuthMessage(origin: string) {
  return `Google Maps refused this site (${origin}). On the website key, allow ${origin}/* and enable Maps JavaScript API, Places API, and Geocoding API.`;
}

export default function ShopLocationPicker({
  latitude,
  longitude,
  formattedAddress,
  entranceConfirmed,
  onChange,
}: ShopLocationPickerProps) {
  const { t } = useTranslation();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google_map_autocomplete',
    googleMapsApiKey: apiKey || '',
    libraries,
    version: 'weekly',
  });

  const initialPoint = useMemo(() => {
    const lat = parseCoord(latitude);
    const lng = parseCoord(longitude);
    return lat != null && lng != null ? { lat, lng } : null;
    // Capture the coordinates present on first render (edit form).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const lastEmittedRef = useRef<LatLng | null>(initialPoint);
  const requestRef = useRef(0);
  const coordsRef = useRef({ latitude, longitude });
  coordsRef.current = { latitude, longitude };

  const [pin, setPin] = useState<LatLng | null>(initialPoint);
  const [pinAdjusted, setPinAdjusted] = useState(Boolean(initialPoint));
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  const [missingParts, setMissingParts] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [accuracyNote, setAccuracyNote] = useState<string | null>(null);
  const [mapAuthError, setMapAuthError] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(formattedAddress ?? '');

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const moveMapTo = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo({ lat, lng });
    const zoom = map.getZoom() ?? 0;
    if (zoom < STREET_ZOOM) {
      map.setZoom(STREET_ZOOM);
    }
  };

  const keepPinVisible = (latLng: google.maps.LatLng) => {
    const map = mapRef.current;
    const bounds = map?.getBounds();
    if (!map || !bounds || bounds.contains(latLng)) return;
    map.panTo(latLng);
  };

  const emit = (location: ShopLocationPick) => {
    const lat = parseCoord(location.lat);
    const lng = parseCoord(location.lng);
    if (lat != null && lng != null) {
      lastEmittedRef.current = { lat, lng };
    }
    if (location.formattedAddress) {
      setResolvedAddress(location.formattedAddress);
    }
    const missing: string[] = [];
    if (location.addressResolved !== false) {
      if (!location.street_address?.trim()) missing.push('street');
      if (!location.zip?.trim()) missing.push('PIN');
    }
    setMissingParts(missing.length ? missing.join(' or ') : null);
    onChange(location);
  };

  const geocodePin = (lat: number, lng: number, adjusted: boolean) => {
    const requestId = ++requestRef.current;
    setResolving(true);
    setGeocodeFailed(false);
    setPinAdjusted(adjusted);
    reverseGeocode(lat, lng).then((location) => {
      if (requestId !== requestRef.current) return;
      setResolving(false);
      if (!location) {
        setGeocodeFailed(true);
        setMissingParts(null);
        emit({ lat, lng, addressResolved: false, pinAdjusted: adjusted });
        return;
      }
      emit({ ...location, addressResolved: true, pinAdjusted: adjusted });
    });
  };

  const geocodePinRef = useRef(geocodePin);
  geocodePinRef.current = geocodePin;
  const emitRef = useRef(emit);
  emitRef.current = emit;

  const pinIcon = () => ({
    url: PIN_ICON_URL,
    scaledSize: new google.maps.Size(27, 43),
    anchor: new google.maps.Point(13, 43),
  });

  const syncMarker = (map: google.maps.Map, position: LatLng | null) => {
    if (!position) {
      markerRef.current?.setMap(null);
      return;
    }

    if (!markerRef.current) {
      try {
        markerRef.current = new google.maps.Marker({
          map,
          position,
          draggable: true,
          title: t('form:shop-location-pinned', 'Pinned location'),
          zIndex: 999,
          icon: pinIcon(),
        });
      } catch (error) {
        setLocationError(
          error instanceof Error
            ? error.message
            : t(
                'form:shop-location-geocode-failed',
                'Could not read an address for this pin. Enter the address below.',
              ),
        );
        return;
      }
      markerRef.current.addListener('drag', () => {
        const next = markerRef.current?.getPosition();
        if (!next) return;
        keepPinVisible(next);
      });
      markerRef.current.addListener('dragend', () => {
        const next = markerRef.current?.getPosition();
        if (!next) return;
        const lat = next.lat();
        const lng = next.lng();
        keepPinVisible(next);
        mapRef.current?.panTo(next);
        setPin({ lat, lng });
        setPinAdjusted(true);
        setLocationError(null);
        setAccuracyNote(null);
        emitRef.current({
          lat,
          lng,
          addressResolved: false,
          pinAdjusted: true,
        });
        geocodePinRef.current(lat, lng, true);
      });
      return;
    }

    markerRef.current.setMap(map);
    const current = markerRef.current.getPosition();
    if (
      !current ||
      !samePoint(
        { lat: current.lat(), lng: current.lng() },
        position.lat,
        position.lng,
      )
    ) {
      markerRef.current.setPosition(position);
    }
  };

  const noteMapFailure = (map: google.maps.Map) => {
    window.setTimeout(() => {
      const root = map.getDiv();
      if (
        root.querySelector('.gm-err-container, .gm-err-message, .gm-err-title')
      ) {
        setMapAuthError(true);
      }
    }, 2000);
  };

  useEffect(() => {
    const onFailure = () => setMapAuthError(true);
    window.addEventListener(MAPS_AUTH_FAILURE_EVENT, onFailure);
    return () => window.removeEventListener(MAPS_AUTH_FAILURE_EVENT, onFailure);
  }, []);

  useEffect(() => {
    if (typeof entranceConfirmed === 'boolean') {
      setPinAdjusted(entranceConfirmed);
    }
  }, [entranceConfirmed]);

  useEffect(() => {
    if (formattedAddress) {
      setResolvedAddress(formattedAddress);
    }
  }, [formattedAddress]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncMarker(map, pin);
    map.setOptions({ minZoom: pin ? MIN_ZOOM : 3 });
  }, [pin]);

  useEffect(() => {
    const lat = parseCoord(latitude);
    const lng = parseCoord(longitude);
    if (lat == null || lng == null) return;
    if (samePoint(lastEmittedRef.current, lat, lng)) return;

    const timer = window.setTimeout(() => {
      if (samePoint(lastEmittedRef.current, lat, lng)) return;
      setPin({ lat, lng });
      setAccuracyNote(null);
      lastEmittedRef.current = { lat, lng };
      moveMapTo(lat, lng);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [latitude, longitude]);

  const placePin = (
    lat: number,
    lng: number,
    options?: { location?: GoogleMapLocation; pinAdjusted?: boolean },
  ) => {
    const adjusted = options?.pinAdjusted ?? false;
    setPin({ lat, lng });
    setPinAdjusted(adjusted);
    lastEmittedRef.current = { lat, lng };
    moveMapTo(lat, lng);
    if (!options?.location) {
      emit({ lat, lng, addressResolved: false, pinAdjusted: adjusted });
    }
    if (options?.location) {
      emit({
        ...options.location,
        lat,
        lng,
        addressResolved: true,
        pinAdjusted: adjusted,
      });
      return;
    }
    geocodePin(lat, lng, adjusted);
  };

  const handleSearch = (location: GoogleMapLocation) => {
    const lat = parseCoord(location.lat);
    const lng = parseCoord(location.lng);
    setGeocodeFailed(false);
    setLocationError(null);
    setAccuracyNote(null);
    if (lat == null || lng == null) {
      emit({ ...location, addressResolved: true, pinAdjusted: false });
      return;
    }
    placePin(lat, lng, { location, pinAdjusted: false });
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        t(
          'form:shop-location-geolocation-unsupported',
          'This browser has no device location. Search for the shop, or type the coordinates below.',
        ),
      );
      return;
    }

    const requestPosition = (enableHighAccuracy: boolean, timeout: number) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy,
          timeout,
          maximumAge: enableHighAccuracy ? 0 : 60000,
        });
      });

    const showLocationError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        setLocationError(
          t(
            'form:shop-location-permission-denied',
            'Location permission was denied. Search for the shop, or type the coordinates below.',
          ),
        );
        return;
      }
      if (error.code === error.TIMEOUT) {
        setLocationError(
          t(
            'form:shop-location-position-timeout',
            'This device took too long to report a location. Search for the shop, or type the coordinates below.',
          ),
        );
        return;
      }
      setLocationError(
        t(
          'form:shop-location-position-unavailable',
          'This device could not provide a location. Search for the shop, or type the coordinates below.',
        ),
      );
    };

    setLocating(true);
    setGeocodeFailed(false);
    setLocationError(null);
    setAccuracyNote(null);

    requestPosition(true, 8000)
      .catch((error: GeolocationPositionError) => {
        if (error.code === error.PERMISSION_DENIED) throw error;
        return requestPosition(false, 8000);
      })
      .then((position) => {
        setLocating(false);
        const accuracy = position.coords.accuracy;
        if (accuracy > ROUGH_ACCURACY_METERS) {
          setAccuracyNote(
            t('form:shop-location-rough-fix', {
              meters: Math.round(accuracy),
              defaultValue: `This device is only accurate to about ${Math.round(accuracy)} m. Drag the pin to the shop entrance.`,
            }),
          );
        }
        placePin(position.coords.latitude, position.coords.longitude, {
          pinAdjusted: false,
        });
      })
      .catch((error: GeolocationPositionError) => {
        setLocating(false);
        showLocationError(error);
      });
  };

  if (!apiKey || apiKey.trim() === '') {
    return (
      <div className="rounded border border-red-300 p-4 text-sm text-red-500">
        {t(
          'form:shop-location-map-key-missing',
          'Google Maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAP_API_KEY to pick a shop pin.',
        )}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded border border-red-300 p-4 text-sm text-red-500">
        <p>{t('common:text-map-cant-load', 'The map could not be loaded.')}</p>
        <p className="mt-2 text-xs">
          {t('form:shop-location-map-auth-failed', {
            origin: siteOrigin,
            defaultValue: mapAuthMessage(siteOrigin),
          })}
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-80 items-center justify-center rounded-md border border-border/60">
        <Loader simple className="h-6 w-6" />
      </div>
    );
  }

  const shownLat = parseCoord(latitude);
  const shownLng = parseCoord(longitude);

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <GooglePlacesAutocomplete
            icon
            restrictCountry="in"
            placeholder={t(
              'form:shop-location-search-placeholder',
              'Search shop, area, or landmark',
            )}
            onChange={handleSearch}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="small"
          className="shrink-0 !text-heading"
          loading={locating}
          disabled={locating}
          onClick={handleCurrentLocation}
        >
          {locating
            ? t('form:shop-location-locating', 'Locating…')
            : t('form:shop-location-use-current', "Use this device's location")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          'form:shop-location-device-hint',
          "On a computer this is the network's rough area, often the wrong block. It is not the shop door.",
        )}
      </p>
      {locationError ? (
        <p className="text-xs text-red-500">{locationError}</p>
      ) : null}
      {accuracyNote ? (
        <p className="text-xs text-amber-700">{accuracyNote}</p>
      ) : null}

      <div className="relative h-80 overflow-hidden rounded-md border border-border/60 bg-muted/30">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          defaultCenter={pin ?? INDIA_CENTER}
          defaultZoom={pin ? STREET_ZOOM : OVERVIEW_ZOOM}
          onLoad={(map) => {
            mapRef.current = map;
            const lat = parseCoord(coordsRef.current.latitude);
            const lng = parseCoord(coordsRef.current.longitude);
            const position = lat != null && lng != null ? { lat, lng } : null;
            syncMarker(map, position);
            noteMapFailure(map);
            map.panTo(position ?? INDIA_CENTER);
            map.setZoom(position ? STREET_ZOOM : OVERVIEW_ZOOM);
            if (
              position &&
              (!initialPoint ||
                !samePoint(initialPoint, position.lat, position.lng))
            ) {
              setPin(position);
            }
          }}
          onClick={(event) => {
            if (!event.latLng) return;
            const zoom = mapRef.current?.getZoom() ?? 0;
            setLocationError(null);
            setAccuracyNote(null);
            placePin(event.latLng.lat(), event.latLng.lng(), {
              pinAdjusted: zoom >= MIN_ZOOM,
            });
          }}
          onUnmount={() => {
            markerRef.current?.setMap(null);
            markerRef.current = null;
            mapRef.current = null;
          }}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'cooperative',
            scrollwheel: false,
            draggable: true,
            keyboardShortcuts: false,
            minZoom: pin ? MIN_ZOOM : 3,
            maxZoom: MAX_ZOOM,
            clickableIcons: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        />
        {!pin && !mapAuthError ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 mx-3 rounded-md bg-white/95 px-3 py-2 text-center text-xs text-heading shadow-sm">
            {t(
              'form:shop-location-place-pin',
              'Search for the shop, or click the map to move closer. A click on this wide view is not saved.',
            )}
          </div>
        ) : null}
        {mapAuthError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 p-4 text-center text-sm text-red-600">
            {t('form:shop-location-map-auth-failed', {
              origin: siteOrigin,
              defaultValue: mapAuthMessage(siteOrigin),
            })}
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {t(
          'form:shop-location-pin-hint',
          'Drag the map to look around. Drag the pin, or click the entrance, to set the point. Scrolling the page does not zoom the map.',
        )}
      </p>
      {pin && !pinAdjusted ? (
        <p className="text-xs text-amber-700">
          {t(
            'form:shop-location-confirm-entrance',
            'This point is not the entrance yet. Click the entrance or drag the pin onto it before saving.',
          )}
        </p>
      ) : null}

      <div className="rounded-md border border-border/60 bg-accent/5 px-3 py-2.5">
        <p className="text-xs font-medium text-muted-foreground">
          {t('form:shop-location-pinned', 'Pinned location')}
        </p>
        <p className="mt-0.5 text-sm text-heading">
          {resolving
            ? t('form:shop-location-finding', 'Finding address…')
            : resolvedAddress ||
              t(
                'form:shop-location-empty',
                'Search or move the pin to set the shop location.',
              )}
        </p>
        {shownLat != null && shownLng != null ? (
          <p className="mt-1 text-xs text-body">
            {shownLat.toFixed(6)}, {shownLng.toFixed(6)}
          </p>
        ) : null}
        {geocodeFailed ? (
          <p className="mt-1 text-xs text-red-500">
            {t(
              'form:shop-location-geocode-failed',
              'Could not read an address for this pin. The address lines were left as you typed them.',
            )}
          </p>
        ) : null}
        {missingParts ? (
          <p className="mt-1 text-xs text-amber-700">
            {t('form:shop-location-missing-parts', {
              parts: missingParts,
              defaultValue: `This result has no ${missingParts}. Type the missing lines below. A PIN is optional.`,
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
