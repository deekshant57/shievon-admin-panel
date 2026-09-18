import * as yup from 'yup';
import { phoneRegExp, URLRegExp } from '@/utils/constants';

const currentDate = new Date();

export const shopValidationSchema = yup.object().shape({
  name: yup.string().required('form:error-name-required'),
  balance: yup.object().shape({
    payment_info: yup.object().shape({
      name: yup
        .string()
        .trim()
        .required('form:error-account-holder-name-required'),
      email: yup
        .string()
        .trim()
        .required('form:error-account-holder-email-required')
        .email('form:error-email-format'),
      bank: yup.string().trim().required('form:error-bank-name-required'),
      account: yup
        .string()
        .transform((value) =>
          value === '' || value == null ? undefined : String(value).trim(),
        )
        .required('form:error-account-number-required')
        .matches(/^\d{9,18}$/, 'form:error-account-number-format'),
      ifsc: yup
        .string()
        .transform((value) =>
          value ? String(value).trim().toUpperCase() : value,
        )
        .required('form:error-ifsc-required')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'form:error-ifsc-format'),
    }),
  }),
  settings: yup.object().shape({
    contact: yup
      .string()
      .required('form:error-contact-number-required')
      .matches(phoneRegExp, 'form:error-contact-number-valid-required'),
    website: yup
      .string()
      .nullable()
      .test('url-format', 'form:error-url-valid-required', function(value) {
        if (!value || value.length === 0) {
          return true; // Allow empty values
        }
        return URLRegExp.test(value);
      }),
    location: yup.object().shape({
      lat: yup
        .number()
        .typeError('form:error-lat-required')
        .required('form:error-lat-required')
        .min(-90, 'form:error-lat-range')
        .max(90, 'form:error-lat-range'),
      lng: yup
        .number()
        .typeError('form:error-lng-required')
        .required('form:error-lng-required')
        .min(-180, 'form:error-lng-range')
        .max(180, 'form:error-lng-range'),
    }),
    socials: yup.array().of(
      yup.object().shape({
        url: yup.string().when('icon', (data) => {
          if (data) {
            return yup.string().required('form:error-url-required');
          }
          return yup.string().nullable();
        }),
      }),
    ),
    shopMaintenance: yup
      .object()
      .when('isShopUnderMaintenance', {
        is: (data: boolean) => data,
        then: () =>
          yup.object().shape({
            title: yup.string().required('Title is required'),
            description: yup.string().required('Description is required'),
            start: yup
              .date()
              .min(
                currentDate.toDateString(),
                `Maintenance start date  field must be later than ${currentDate.toDateString()}`,
              )
              .required('Start date is required'),
            until: yup
              .date()
              .required('Until date is required')
              .min(
                yup.ref('start'),
                'Until date must be greater than or equal to start date',
              ),
          }),
      })
      .notRequired(),
  }),
  address: yup.object().shape({
    country: yup.string().required('form:error-country-required'),
    city: yup.string().required('form:error-city-required'),
    state: yup.string().required('form:error-state-required'),
    zip: yup.string().required('form:error-zip-required'),
    street_address: yup.string().required('form:error-street-address-required'),
  }),
  timings: yup.object().shape({
    open: yup.string().required('form:error-opening-time-required'),
    close: yup.string().required('form:error-closing-time-required'),
  }),
});

export const approveShopSchema = yup.object().shape({
  admin_commission_rate: yup
    .number()
    .typeError('Commission rate must be a number')
    .required('You must need to set your commission rate'),
});