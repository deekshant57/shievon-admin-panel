import * as yup from 'yup';
import { phoneRegExp, URLRegExp } from '@/utils/constants';

const currentDate = new Date();

export const shopValidationSchema = yup.object().shape({
  name: yup.string().required('form:error-name-required'),
  balance: yup.object().shape({
    payment_info: yup.object().shape({
      // Payment info marked as not required - validation commented out
      // email: yup
      //   .string()
      //   .required('form:error-account-holder-email-required')
      //   .typeError('form:error-email-string')
      //   .email('form:error-email-format'),
      // name: yup.string().required('form:error-account-holder-name-required'),
      // bank: yup.string().required('form:error-bank-name-required'),
      // account: yup
      //   .number()
      //   .positive('form:error-account-number-positive-required')
      //   .integer('form:error-account-number-integer-required')
      //   .required('form:error-account-number-required')
      //   .transform((value) => (isNaN(value) ? undefined : value)),
      email: yup.string().nullable().optional(),
      name: yup.string().nullable().optional(),
      bank: yup.string().nullable().optional(),
      account: yup
        .number()
        .nullable()
        .optional()
        .transform((value) => (isNaN(value) ? undefined : value)),
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
    close: yup
      .string()
      .required('form:error-closing-time-required')
      .test(
        'close-after-open',
        'form:error-closing-time-before-opening',
        function (close) {
          const { open } = this.parent;
          if (!open || !close) return true;
          return close >= open;
        }
      ),
  }),
});

export const approveShopSchema = yup.object().shape({
  admin_commission_rate: yup
    .number()
    .typeError('Commission rate must be a number')
    .required('You must need to set your commission rate'),
});