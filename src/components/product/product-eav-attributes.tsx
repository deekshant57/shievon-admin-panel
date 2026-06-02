import { useFormContext, Path } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import Input from '@/components/ui/input';
import SelectInput from '@/components/ui/select-input';
import {
  AttributeTemplateResponse,
  ProductAttributeDefinition,
  getVariantAttributesFromTemplate,
} from '@/types';
import { ProductFormValues } from '@/components/product/form-utils';
import ProductFormSection from '@/components/product/product-form-section';

interface Props {
  template?: AttributeTemplateResponse;
  /** When "simple", variant attributes (e.g. Size, Color) are shown as single-select and stored in eav_attributes for the simple payload. */
  productType?: 'simple' | 'variable';
}

const PRODUCT_ATTRIBUTES_TITLE =
  'form:form-title-product-attributes';
const PRODUCT_ATTRIBUTES_DESCRIPTION =
  'form:form-description-product-attributes';
const VARIANT_ATTRIBUTES_TITLE = 'Size & Color';
const VARIANT_ATTRIBUTES_DESCRIPTION =
  'Select one value for each option (e.g. size, color). These will be included in the product attributes.';
const BOOLEAN_OPTIONS = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

const sortBySortOrder = <T extends { sort_order?: number }>(items: T[] = []) =>
  [...items].sort(
    (a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER),
  );

const sortAttributeOptions = (attribute: ProductAttributeDefinition) => ({
  ...attribute,
  options: sortBySortOrder(attribute.options ?? []),
});

/**
 * Product-level EAV attributes (and for simple product, variant attributes as single-select).
 * For simple product type, variant attributes (Size, Color) are shown so user can pick one per attribute; they are sent in the root attributes array.
 */
const ProductEavAttributes = ({ template, productType }: Props) => {
  const { t } = useTranslation('common');
  const {
    control,
    register,
    getValues,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const productAttributes: ProductAttributeDefinition[] =
    sortBySortOrder(template?.product_attributes ?? []).map(sortAttributeOptions);
  const variantAttributes: ProductAttributeDefinition[] =
    productType === 'simple'
      ? sortBySortOrder(getVariantAttributesFromTemplate(template)).map(
          sortAttributeOptions,
        )
      : [];

  // Resolve initial enum values: form stores the full option object { id, label } from
  // getProductDefaultValues. Pass it as defaultValue on Controller so it's set at
  // registration time (setValue doesn't work with shouldUnregister before registration).
  const resolveEnumDefault = (attrCode: string, options: any[]) => {
    const stored = (getValues('eav_attributes') as any)?.[attrCode]?.enum_value_id;
    if (!stored) return undefined;
    // Already a full option object
    if (typeof stored === 'object' && stored.id != null) return stored;
    // Numeric ID - find matching option
    const numId = Number(stored);
    return options.find((opt: any) => opt.id === numId) ?? undefined;
  };

  const resolveBooleanDefault = (attrCode: string) => {
    const stored = (getValues('eav_attributes') as any)?.[attrCode]?.value_boolean;
    if (stored == null || stored === '') return undefined;
    if (typeof stored === 'object' && typeof stored.value === 'boolean') {
      return stored;
    }
    return BOOLEAN_OPTIONS.find((option) => option.value === stored);
  };

  const getFieldError = (attrCode: string, field: string) =>
    t(
      ((errors.eav_attributes as any)?.[attrCode]?.[field]?.message ??
        '') as string,
    );

  const hasProductAttrs = productAttributes.length > 0;
  const hasVariantAttrs = variantAttributes.length > 0;
  if (!hasProductAttrs && !hasVariantAttrs) return null;

  const renderProductField = (attribute: ProductAttributeDefinition) => {
    const fieldBase = `eav_attributes.${attribute.code}`;

    if (attribute.data_type === 'enum') {
      const defaultVal = resolveEnumDefault(attribute.code, attribute.options ?? []);
      return (
        <SelectInput
          key={attribute.code}
          control={control}
          name={`${fieldBase}.enum_value_id`}
          defaultValue={defaultVal}
          label={attribute.is_mandatory ? `${attribute.name}*` : attribute.name}
          required={attribute.is_mandatory}
          // @ts-ignore
          options={attribute.options ?? []}
          getOptionLabel={(option: any) => option?.label ?? option?.value ?? ''}
          getOptionValue={(option: any) => option?.id}
          placeholder={t('form:text-select')}
          error={getFieldError(attribute.code, 'enum_value_id')}
        />
      );
    }

    if (attribute.data_type === 'boolean') {
      return (
        <SelectInput
          key={attribute.code}
          control={control}
          name={`${fieldBase}.value_boolean`}
          defaultValue={resolveBooleanDefault(attribute.code)}
          label={attribute.is_mandatory ? `${attribute.name}*` : attribute.name}
          required={attribute.is_mandatory}
          options={BOOLEAN_OPTIONS}
          getOptionLabel={(option: any) => option?.label ?? ''}
          getOptionValue={(option: any) => `${option?.value}`}
          placeholder={t('form:text-select')}
          error={getFieldError(attribute.code, 'value_boolean')}
        />
      );
    }

    if (attribute.data_type === 'number') {
      return (
        <Input
          key={attribute.code}
          type="number"
          label={attribute.is_mandatory ? `${attribute.name}*` : attribute.name}
          {...register(`${fieldBase}.value_number` as Path<ProductFormValues>)}
          error={getFieldError(attribute.code, 'value_number')}
          variant="outline"
          className="mb-5"
        />
      );
    }

    return (
      <Input
        key={attribute.code}
        label={attribute.is_mandatory ? `${attribute.name}*` : attribute.name}
        {...register(`${fieldBase}.value_string` as Path<ProductFormValues>)}
        error={getFieldError(attribute.code, 'value_string')}
        variant="outline"
        className="mb-5"
      />
    );
  };

  const renderVariantAttributeField = (attribute: ProductAttributeDefinition) => {
    const fieldBase = `eav_attributes.${attribute.code}`;
    const defaultVal = resolveEnumDefault(attribute.code, attribute.options ?? []);
    return (
      <div key={attribute.code} className="mb-5">
      <SelectInput
        key={attribute.code}
        control={control}
        name={`${fieldBase}.enum_value_id`}
        defaultValue={defaultVal}
        label={attribute.is_mandatory ? `${attribute.name}*` : attribute.name}
        required={attribute.is_mandatory}
        options={attribute.options ?? []}
        getOptionLabel={(option: any) => option?.label ?? option?.value ?? ''}
        getOptionValue={(option: any) => option?.id}
        placeholder={t('form:text-select')}
        error={getFieldError(attribute.code, 'enum_value_id')}
      />
      </div>
    );
  };

  return (
    <>
      {hasProductAttrs && (
        <ProductFormSection
          title={t(PRODUCT_ATTRIBUTES_TITLE) || 'Product Parameters'}
          details={
            t(PRODUCT_ATTRIBUTES_DESCRIPTION) ||
            'Additional parameters for this product based on its category.'
          }
        >
          <div className="grid grid-cols-1 gap-5 mb-5">
            {productAttributes.map((attribute) => renderProductField(attribute))}
          </div>
        </ProductFormSection>
      )}
      {hasVariantAttrs && (
        <ProductFormSection
          title={
            t(VARIANT_ATTRIBUTES_TITLE) ||
            'Variant options (select one per attribute)'
          }
          details={
            t(VARIANT_ATTRIBUTES_DESCRIPTION) ||
            'Select one value for each option (e.g. size, color). These will be included in the product attributes.'
          }
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {variantAttributes.map((attribute) =>
              renderVariantAttributeField(attribute),
            )}
          </div>
        </ProductFormSection>
      )}
    </>
  );
};

export default ProductEavAttributes;
