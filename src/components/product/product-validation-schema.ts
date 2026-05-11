import { ProductStatus, ProductType } from '@/types';
import * as yup from 'yup';
import { MAXIMUM_WORD_COUNT_FOR_RICH_TEXT_EDITOR } from '@/utils/constants';

// fetch
// yup conditionnally
const SUPPORTED_IMAGE_FORMATS = ['image/jpg', 'image/jpeg', 'image/png'];

// Single with no variant options: require top-level sku/price/quantity. Single with one variant: use variation_options[0].
// is() receives (value, context); get sibling fields from context.parent (form values) since refs are not passed as array.
function requireTopLevelWhenSingleWithoutVariants(value: unknown, context: any) {
  let productType: any;
  let variationOptions: any;
  if (Array.isArray(value) && value.length >= 2) {
    [productType, variationOptions] = value;
  } else {
    const parent = context?.parent ?? context?.options?.parent ?? {};
    productType = parent.product_type;
    variationOptions = parent.variation_options;
  }
  const isSingle = productType?.value === ProductType.Single;
  const noVariants =
    !variationOptions ||
    !Array.isArray(variationOptions) ||
    variationOptions.length === 0;
  return isSingle && noVariants;
}

export const productValidationSchema = yup.object().shape({
  name: yup.string().required('form:error-name-required'),
  product_type: yup.object().required('form:error-product-type-required'),
  sku: yup.mixed().when(['product_type', 'variation_options'], {
    is: requireTopLevelWhenSingleWithoutVariants,
    then: () => yup.string().nullable().required('form:error-sku-required'),
  }),
  price: yup.mixed().when(['product_type', 'variation_options'], {
    is: requireTopLevelWhenSingleWithoutVariants,
    then: () =>
      yup
        .number()
        .typeError('form:error-price-must-number')
        .positive('form:error-price-must-positive')
        .required('form:error-price-required'),
  }),
  sale_price: yup.mixed().when(['product_type', 'variation_options'], {
    is: requireTopLevelWhenSingleWithoutVariants,
    then: () =>
      yup
        .number()
        .typeError('form:error-sale-price-must-number')
        .positive('form:error-sale-price-must-positive')
        .required('form:error-sale-price-required'),
    otherwise: () =>
      yup
        .number()
        .transform((value) => (isNaN(value) ? undefined : value))
        .positive('form:error-sale-price-must-positive')
        .nullable(),
  }),
  quantity: yup.mixed().when(['product_type', 'variation_options'], {
    is: requireTopLevelWhenSingleWithoutVariants,
    then: () =>
      yup
        .number()
        .typeError('form:error-quantity-must-number')
        .positive('form:error-quantity-must-positive')
        .integer('form:error-quantity-must-integer')
        .required('form:error-quantity-required'),
  }),
  unit: yup.string().nullable(),
  // type_id is optional on the API; type (Group) is optional in the form
  type: yup.object().nullable(),
  status: yup.string().nullable().required('form:error-status-required'),
  variation_options: yup.array().of(
    yup.object().shape({
      price: yup
        .number()
        .typeError('form:error-price-must-number')
        .positive('form:error-price-must-positive')
        .required('form:error-price-required'),
      sale_price: yup
        .number()
        .typeError('form:error-sale-price-must-number')
        .positive('form:error-sale-price-must-positive')
        .required('form:error-sale-price-required'),
      quantity: yup
        .number()
        .typeError('form:error-quantity-must-number')
        .positive('form:error-quantity-must-positive')
        .integer('form:error-quantity-must-integer')
        .required('form:error-quantity-required'),
      sku: yup.string().required('form:error-sku-required'),
      is_digital: yup.boolean(),
      digital_file_input: yup.object().when('is_digital', {
        is: true,
        then: () =>
          yup
            .object()
            .shape({
              id: yup.string().required(),
            })
            .required('Degigtal File is required'),
        otherwise: () =>
          yup
            .object()
            .shape({
              id: yup.string().notRequired(),
              original: yup.string().notRequired(),
            })
            .notRequired()
            .nullable(),
      }),
    }),
  ),
  is_digital: yup.boolean(),
  digital_file_input: yup.object().when('is_digital', {
    is: true,
    then: () =>
      yup.object().shape({
        id: yup.string().required(),
      }),
    otherwise: () =>
      yup
        .object()
        .shape({
          id: yup.string().notRequired(),
          original: yup.string().notRequired(),
        })
        .notRequired()
        .nullable(),
  }),
  video: yup.array().of(
    yup.object().shape({
      url: yup.string().required('Video URL is required'),
    }),
  ),
  description: yup
    .string()
    .max(
      MAXIMUM_WORD_COUNT_FOR_RICH_TEXT_EDITOR,
      'form:error-description-maximum-title',
    ),

  is_external: yup.boolean(),
  external_product_url: yup.object().when('is_external', {
    is: true,
    then: () =>
      yup.string().required('form:error-external-product-url-required'),
    otherwise: () => yup.string().notRequired().nullable(),
  }),
  external_product_button_text: yup.object().when('is_external', {
    is: true,
    then: () =>
      yup.string().required('form:error-external-product-button-text-required'),
    otherwise: () => yup.string().notRequired().nullable(),
  }),

  // image: yup
  //   .mixed()
  //   .nullable()
  //   .required('A file is required')
  //   .test(
  //     'FILE_SIZE',
  //     'Uploaded file is too big.',
  //     (value) => !value || (value && value.size <= 1024 * 1024)
  //   )
  //   .test(
  //     'FILE_FORMAT',
  //     'Uploaded file has unsupported format.',
  //     (value) =>
  //       !value || (value && SUPPORTED_IMAGE_FORMATS.includes(value?.type))
  //   ),
});
