import { Autocomplete } from '@react-google-maps/api';
import { GoogleMapLocation } from '@/types';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import Loader from '@/components/ui/loader/loader';
import { MapPin } from '@/components/icons/map-pin';
import useLocation, { locationAtom } from '@/utils/use-location';
import { useAtom } from 'jotai';
import CurrentLocation from '@/components/icons/current-location';

export default function GooglePlacesAutocomplete({
  onChange,
  onChangeCurrentLocation,
  data,
  disabled = false,
  icon = false,
  placeholder,
}: {
  onChange?: () => void;
  onChangeCurrentLocation?: (location: GoogleMapLocation) => void;
  data?: GoogleMapLocation;
  disabled?: boolean;
  icon?: boolean;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
  const [
    onLoad,
    onUnmount,
    onPlaceChanged,
    getCurrentLocation,
    isLoaded,
    loadError,
  ] = useLocation({ onChange, onChangeCurrentLocation, setInputValue });

  useEffect(() => {
    const getLocation = data?.formattedAddress;
    setInputValue(getLocation!);
  }, [data]);

  // Show error immediately if API key is missing
  if (!apiKey || apiKey.trim() === '') {
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded">
        <p className="font-semibold mb-2">Google Maps API Key Missing</p>
        <p className="text-xs">
          Please set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAP_API_KEY</code> in your environment variables.
        </p>
      </div>
    );
  }

  if (loadError) {
    console.error('Google Maps API Load Error:', loadError);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
    const hasApiKey = apiKey && apiKey.trim() !== '';
    
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded">
        <p className="font-semibold mb-2">{t('common:text-map-cant-load')}</p>
        <div className="text-xs space-y-1">
          {!hasApiKey && (
            <p className="font-semibold">❌ API Key Missing: NEXT_PUBLIC_GOOGLE_MAP_API_KEY is not set in your environment variables.</p>
          )}
          <p className="font-semibold mt-2">Please verify the following in Google Cloud Console:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>✅ <strong>Maps JavaScript API</strong> is enabled</li>
            <li>✅ <strong>Places API</strong> is enabled (legacy)</li>
            <li>✅ <strong>Places API (New)</strong> is enabled (required)</li>
            <li>✅ <strong>Billing account</strong> is active and linked to your project</li>
            <li>✅ API key restrictions allow your domain (or temporarily remove restrictions for testing)</li>
            <li>✅ API key has access to: Maps JavaScript API, Places API, Places API (New)</li>
          </ul>
          <p className="mt-2 text-xs">
            <a 
              href="https://console.cloud.google.com/apis/library" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Open Google Cloud Console →
            </a>
          </p>
        </div>
      </div>
    );
  }

  return isLoaded ? (
    <div className="relative">
      {icon && (
        <div className="absolute top-0 left-0 flex h-12 w-10 items-center justify-center text-gray-400">
          <MapPin className="w-[18px]" />
        </div>
      )}

      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        onUnmount={onUnmount}
        fields={[
          'address_components',
          'geometry.location',
          'formatted_address',
        ]}
        componentRestrictions={{ country: 'in' }}
        // Note: Not setting 'types' prop to avoid "cannot be mixed" errors
        // This allows all place types: establishments, addresses, and geocodes
      >
        <input
          type="text"
          placeholder={placeholder || t('form:placeholder-search-location')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={`flex h-12 w-full appearance-none items-center rounded border border-border-base text-sm text-heading transition duration-300 ease-in-out  focus:border-accent focus:outline-none focus:ring-0 ${disabled ? 'cursor-not-allowed border-[#D4D8DD] bg-[#EEF1F4]' : ''
            } ${icon ? 'pe-4 ps-9' : 'px-4'}`}
          disabled={disabled}
        />
      </Autocomplete>
      {/* <div className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center text-accent">
        <CurrentLocation className='hover:text-accent cursor-pointer w-5 h-5'
          onClick={() => {
            getCurrentLocation();
            setInputValue(location?.formattedAddress!);
          }}
        />
      </div> */}
    </div>
  ) : (
    <Loader simple={true} className="h-6 w-6" />
  );
}
