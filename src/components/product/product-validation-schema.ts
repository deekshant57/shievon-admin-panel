import { getVariantAttributesFromTemplate, ProductType } from '@/types';
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

function getRequiredAttributeMessage(attribute: any) {
  return attribute?.name
    ? `${attribute.name} is required`
    : 'form:error-field-required';
}

function hasDynamicAttributeValue(attribute: any, value: any) {
  if (!value) return false;

  if (attribute.data_type === 'enum') {
    const enumValue = value.enum_value_id;
    return enumValue != null && enumValue !== '';
  }

  if (attribute.data_type === 'number') {
    return (
      value.value_number !== undefined &&
      value.value_number !== null &&
      `${value.value_number}`.trim() !== ''
    );
  }

  if (attribute.data_type === 'boolean') {
    const booleanValue =
      value.value_boolean != null && typeof value.value_boolean === 'object'
        ? value.value_boolean.value
        : value.value_boolean;
    return typeof booleanValue === 'boolean';
  }

  return (
    typeof value.value_string === 'string' &&
    value.value_string.trim() !== ''
  );
}

function getAttributeValueField(attribute: any) {
  if (attribute.data_type === 'enum') return 'enum_value_id';
  if (attribute.data_type === 'number') return 'value_number';
  if (attribute.data_type === 'boolean') return 'value_boolean';
  return 'value_string';
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
  eav_attributes: yup.mixed().test(
    'required-eav-attributes',
    'form:error-field-required',
    function (value) {
      const template =
        this.options.context?.attributeTemplateRef?.current ?? null;
      if (!template) return true;

      const productType = this.parent?.product_type?.value;
      const attributes = [
        ...(template.product_attributes ?? []),
        ...(productType === ProductType.Single
          ? getVariantAttributesFromTemplate(template)
          : []),
      ];
      const missing = attributes.find(
        (attribute: any) =>
          attribute.is_mandatory &&
          !hasDynamicAttributeValue(attribute, (value as any)?.[attribute.code]),
      );

      if (!missing) return true;

      return this.createError({
        path: `eav_attributes.${missing.code}.${getAttributeValueField(
          missing,
        )}`,
        message: getRequiredAttributeMessage(missing),
      });
    },
  ),
  eav_variant_dimensions: yup.mixed().test(
    'required-eav-variant-dimensions',
    'form:error-field-required',
    function (value) {
      if (this.parent?.product_type?.value !== ProductType.Variable) {
        return true;
      }

      const template =
        this.options.context?.attributeTemplateRef?.current ?? null;
      if (!template) return true;

      const variantAttributes = getVariantAttributesFromTemplate(template);
      const missingIndex = variantAttributes.findIndex((attribute: any, index) => {
        if (!attribute.is_mandatory) return false;
        const selectedOptions = (value as any)?.[index]?.selectedOptions;
        return !Array.isArray(selectedOptions) || selectedOptions.length === 0;
      });

      if (missingIndex < 0) return true;

      const missing = variantAttributes[missingIndex];
      return this.createError({
        path: `eav_variant_dimensions.${missingIndex}.selectedOptions`,
        message: getRequiredAttributeMessage(missing),
      });
    },
  ),
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
