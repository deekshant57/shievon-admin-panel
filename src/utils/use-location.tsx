import { GoogleMapLocation } from '@/types';
import { useJsApiLoader } from '@react-google-maps/api';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { atom } from 'jotai';

export const locationAtom = atom<GoogleMapLocation | null>(null);

const libraries: any = ['places'];

interface Component {
  long_name: string;
  short_name: string;
  types: string[];
}

export const fullAddressAtom = atom((get) => {
  const location = get(locationAtom);
  return location
    ? `${location.street_address}, ${location.city}, ${location.state}, ${location.zip}, ${location.country}`
    : '';
});

export function getLocation(placeOrResult: any) {
  // Declare the location variable with the Location interface
  const location: GoogleMapLocation = {
    lat: placeOrResult?.geometry?.location.lat(),
    lng: placeOrResult?.geometry?.location.lng(),
    formattedAddress: placeOrResult.formatted_address,
    // Extract place name from the place object
    placeName: placeOrResult.name || placeOrResult.formatted_address?.split(',')[0] || '',
  };

  const addressComponents = (placeOrResult.address_components ??
    []) as Component[];
  const streetAddressParts: string[] = [];
  let premiseName = '';

  // Process all address components
  for (const component of addressComponents) {
    const { long_name, short_name, types } = component;

    // Extract country
    if (types.includes('country')) {
      location.country = long_name;
    }

    // Extract state (use short_name for state codes like "GJ" for Gujarat)
    if (types.includes('administrative_area_level_1')) {
      location.state = long_name; // Use long_name for full state name
    }

    // Extract city (locality takes priority)
    if (types.includes('locality')) {
      location.city = long_name;
    } else if (types.includes('administrative_area_level_2') && !location.city) {
      // Fallback to administrative_area_level_2 if locality is not available
      location.city = long_name;
    } else if (types.includes('administrative_area_level_3') && !location.city) {
      // Another fallback option
      location.city = long_name;
    }

    // Extract postal code
    if (types.includes('postal_code')) {
      location.zip = long_name;
    }

    // Build street_address from multiple components
    // Order: street_number -> premise -> route
    if (types.includes('street_number')) {
      streetAddressParts.push(long_name);
    }
    
    // Premise (building/establishment name) - add before route
    if (types.includes('premise')) {
      premiseName = long_name; // Store premise name for place name fallback
      streetAddressParts.push(long_name);
    }
    
    // Route (street name)
    if (types.includes('route')) {
      streetAddressParts.push(long_name);
    }
  }

  // Use premise name as fallback if place name is not available
  if (!location.placeName && premiseName) {
    location.placeName = premiseName;
  }

  // Only a PIN sitting in the postal slot (the segment before the country).
  // A 6-digit plot or phone number earlier in the address is not a PIN.
  if (
    !location.zip &&
    placeOrResult.formatted_address &&
    typeof placeOrResult.formatted_address === 'string'
  ) {
    const parts = placeOrResult.formatted_address
      .split(',')
      .map((part: string) => part.trim())
      .filter(Boolean)
    const stateAndCode = parts.length >= 2 ? parts[parts.length - 2] : ''
    const pinMatch = stateAndCode.match(/(?:^|\s)(\d{6})$/)
    if (pinMatch) {
      location.zip = pinMatch[1]
    }
  }

  // Combine all street address parts
  if (streetAddressParts.length > 0) {
    // Join with comma and space for readability
    // Example: "Zydus Hospital, Zydus Hospital Road"
    location.street_address = streetAddressParts.join(', ');
  } else if (placeOrResult.formatted_address) {
    // Fallback: extract street address from formatted_address
    // Remove city, state, zip, country from the end
    const formatted = placeOrResult.formatted_address;
    const parts = formatted.split(', ');
    
    // Typically formatted_address is: "street, city, state zip, country"
    // We want to keep everything except the last 2-3 parts (city, state zip, country)
    if (parts.length >= 3) {
      // Remove last parts (country, state+zip, city)
      const streetParts = parts.slice(0, parts.length - 2);
      location.street_address = streetParts.join(', ');
    } else {
      location.street_address = formatted;
    }
  }

  if (!location.street_address?.trim()) {
    const fallbackStreet =
      location.placeName || placeOrResult.formatted_address || ''
    if (fallbackStreet) {
      location.street_address = fallbackStreet
    }
  }

  // Return the location object
  return location;
}

interface UseLocationProps {
  onChange?: any;
  onChangeCurrentLocation?: any;
  setInputValue?: any;
}

export default function useLocation({
  onChange,
  onChangeCurrentLocation,
  setInputValue,
}: UseLocationProps) {
  const { t } = useTranslation();
  const [autocomplete, setAutocomplete] = useState<any>(null);
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
  
  // Validate API key exists
  if (!apiKey || apiKey.trim() === '') {
    console.error('Google Maps API Error: NEXT_PUBLIC_GOOGLE_MAP_API_KEY is not set');
  }
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google_map_autocomplete',
    googleMapsApiKey: apiKey || '',
    libraries,
    version: 'weekly', // Use weekly version for latest features
  });

  const onLoad = useCallback((autocompleteInstance: any) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setAutocomplete(true);
  }, []);

  const onPlaceChanged = () => {
    const place = autocomplete?.getPlace();

    if (!place) {
      console.warn('Google Places Autocomplete: No place selected');
      return;
    }

    if (!place?.geometry?.location) {
      console.warn('Google Places Autocomplete: Place selected but no geometry location', place);
      return;
    }

    const location = getLocation(place);
    console.log('Google Places Autocomplete: Location extracted', location);

    if (onChange) {
      onChange(location);
    }

    if (setInputValue) {
      setInputValue(place?.formatted_address);
    }
  };

  const getCurrentLocation = () => {
    if (navigator?.geolocation) {
      navigator?.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const geocoder = new google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              const location = getLocation(results?.[0]);
              onChangeCurrentLocation?.(location);
            }
          });
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  return [
    onLoad,
    onUnmount,
    onPlaceChanged,
    getCurrentLocation,
    isLoaded,
    loadError && t(loadError),
  ];
}
