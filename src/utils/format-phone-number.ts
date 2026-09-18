import parsePhoneNumber, { type CountryCode } from 'libphonenumber-js';
import { useMemo } from 'react';

/**
 * Formats a phone for display. Defaults to India (IN) for national numbers
 * without a country code — Dropit/shop contacts are typically 10-digit mobiles.
 */
export const useFormatPhoneNumber = ({
  customer_contact,
  defaultCountry = 'IN',
}: {
  customer_contact?: string | null;
  defaultCountry?: CountryCode;
}) => {
  const phoneNumber = useMemo(() => {
    if (customer_contact == null) {
      return undefined;
    }

    const raw = String(customer_contact).trim();
    if (!raw) {
      return undefined;
    }

    // Already international — do not prepend another "+"
    if (raw.startsWith('+')) {
      const parsed = parsePhoneNumber(raw);
      return parsed?.formatInternational() ?? raw;
    }

    // National number (e.g. Dropit pilot.phone "9000000036")
    const parsedNational = parsePhoneNumber(raw, defaultCountry);
    if (parsedNational) {
      return parsedNational.formatInternational();
    }

    const digits = raw.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      const parsed = parsePhoneNumber(`+${digits}`);
      return parsed?.formatInternational() ?? `+${digits}`;
    }

    if (digits.length === 10) {
      const parsed = parsePhoneNumber(digits, defaultCountry);
      return parsed?.formatInternational() ?? `+91${digits}`;
    }

    return raw;
  }, [customer_contact, defaultCountry]);

  return phoneNumber;
};
