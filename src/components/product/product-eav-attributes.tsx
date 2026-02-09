import { useFormContext, Path } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import Input from '@/components/ui/input';
import Checkbox from '@/components/ui/checkbox/checkbox';
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

/**
 * Product-level EAV attributes (and for simple product, variant attributes as single-select).
 * For simple product type, variant attributes (Size, Color) are shown so user can pick one per attribute; they are sent in the root attributes array.
 */
const ProductEavAttributes = ({ template, productType }: Props) => {
  const { t } = useTranslation('common');
  const { control, register } = useFormContext<ProductFormValues>();

  const productAttributes: ProductAttributeDefinition[] =
    template?.product_attributes ?? [];
  const variantAttributes: ProductAttributeDefinition[] =
    productType === 'simple'
      ? getVariantAttributesFromTemplate(template)
      : [];

  const hasProductAttrs = productAttributes.length > 0;
  const hasVariantAttrs = variantAttributes.length > 0;
  if (!hasProductAttrs && !hasVariantAttrs) return null;

  const renderProductField = (attribute: ProductAttributeDefinition) => {
    const fieldBase = `eav_attributes.${attribute.code}`;

    if (attribute.data_type === 'enum') {
      return (
        <SelectInput
          key={attribute.code}
          control={control}
          name={`${fieldBase}.enum_value_id`}
          label={attribute.is_mandatory ? `${attribute.name}*` : attribute.name}
          required={attribute.is_mandatory}
          // @ts-ignore
          options={attribute.options ?? []}
          getOptionLabel={(option: any) => option?.label ?? option?.value ?? ''}
          getOptionValue={(option: any) => option?.id}
          placeholder={t('form:text-select')}
        />
      );
    }

    if (attribute.data_type === 'boolean') {
      return (
        <div key={attribute.code} className="flex items-center gap-3">
          <Checkbox
            {...register(`${fieldBase}.value_boolean` as Path<ProductFormValues>)}
            label={attribute.name}
          />
        </div>
      );
    }

    if (attribute.data_type === 'number') {
      return (
        <Input
          key={attribute.code}
          type="number"
          label={attribute.is_mandatory ? `${attribute.name}*` : attribute.name}
          {...register(`${fieldBase}.value_number` as Path<ProductFormValues>)}
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
        variant="outline"
        className="mb-5"
      />
    );
  };

  const renderVariantAttributeField = (attribute: ProductAttributeDefinition) => {
    const fieldBase = `eav_attributes.${attribute.code}`;
    return (
      <div key={attribute.code} className="mb-5">
      <SelectInput
        key={attribute.code}
        control={control}
        name={`${fieldBase}.enum_value_id`}
        label={attribute.is_mandatory ? `${attribute.name}*` : attribute.name}
        required={attribute.is_mandatory}
        options={attribute.options ?? []}
        getOptionLabel={(option: any) => option?.label ?? option?.value ?? ''}
        getOptionValue={(option: any) => option?.id}
        placeholder={t('form:text-select')}
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
