import Input from '@/components/ui/input';
import { useFormContext, useWatch } from 'react-hook-form';
import Label from '@/components/ui/label';
import Title from '@/components/ui/title';
import Checkbox from '@/components/ui/checkbox/checkbox';
import SelectInput from '@/components/ui/select-input';
import { useEffect, useMemo, useRef } from 'react';
import { Product, ProductAttributeDefinition } from '@/types';
import { useTranslation } from 'next-i18next';
import FileInput from '@/components/ui/file-input';
import ValidationError from '@/components/ui/form-validation-error';
import { cartesian } from '@/utils/cartesian';
import { useRouter } from 'next/router';
import { Config } from '@/config';
import { useSettingsQuery } from '@/data/settings';
import { isObject } from 'lodash';
import Alert from '@/components/ui/alert';
import TextArea from '@/components/ui/text-area';
import { TitleAndOptionsInput } from '@/components/product/product-variable-form';
import ProductFormSection from '@/components/product/product-form-section';

type IProps = {
  initialValues?: Product | null;
  shopId: string | undefined;
  variantAttributes: ProductAttributeDefinition[];
  /** Single product: one SKU; user selects one value per attribute (e.g. one Size, one Color). Variable: multi-select, cartesian product. */
  isSingleProduct?: boolean;
};

const sortBySortOrder = <T extends { sort_order?: number }>(items: T[] = []) =>
  [...items].sort(
    (a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER),
  );

export default function ProductVariableEavForm({
  shopId,
  initialValues,
  variantAttributes,
  isSingleProduct = false,
}: IProps) {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const {
    // @ts-ignore
    settings: { options },
  } = useSettingsQuery({
    language: locale!,
  });
  const upload_max_filesize =
    (options?.server_info?.upload_max_filesize ?? 0) / 1024;

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();
  const sortedVariantAttributes = useMemo(
    () =>
      sortBySortOrder(variantAttributes).map((attribute) => ({
        ...attribute,
        options: sortBySortOrder(attribute.options ?? []),
      })),
    [variantAttributes],
  );

  // Compute initial dimension selections from existing variation_options (edit) or empty (create).
  // Used as defaultValue on each Controller and on useWatch so values are available from first render.
  const initialOptions = initialValues?.variation_options ?? [];
  const initialDimensions = useMemo(() => {
    if (!sortedVariantAttributes?.length) return [];
    if (!initialOptions.length || !initialValues?.id) {
      return sortedVariantAttributes.map(() => ({ selectedOptions: [] }));
    }
    return sortedVariantAttributes.map((attr) => {
      const code = attr.code;
      const optionIds = new Set<number>();
      initialOptions.forEach((opt: any) => {
        (opt.attributes ?? [])
          .filter((a: any) => a.definition_code === code)
          .forEach((a: any) => {
            const id = a.enum_value_id ?? a.enum_value?.id;
            if (id != null) optionIds.add(Number(id));
          });
      });
      const selectedOptions = (attr.options ?? [])
        .filter((opt: any) => optionIds.has(Number(opt.id)))
        .map((opt: any) => ({
          id: opt.id,
          label: opt.label ?? opt.value ?? String(opt.id),
        }));
      return { selectedOptions };
    });
  }, [sortedVariantAttributes, initialValues?.id, initialOptions.length]);

  // Watch EAV variant dimension selections.
  // Provide initialDimensions as defaultValue so cartesian product computes on first render
  // (before Controllers register their fields).
  const eavVariantDimensions = useWatch({
    control,
    name: 'eav_variant_dimensions',
    defaultValue: initialDimensions,
  }) as Array<{ selectedOptions?: any[] }> | undefined;

  // Build cartesian product of selected options across all variant attributes.
  // Single product: one value per attribute (stored as single object or [one]); variable: array of selections.
  const cartesianProduct = (() => {
    if (!sortedVariantAttributes?.length) return [];

    const lists = sortedVariantAttributes
      .map((attr, index) => {
        const dim = eavVariantDimensions?.[index];
        const raw = dim?.selectedOptions;
        const selected = isSingleProduct
          ? raw
            ? Array.isArray(raw)
              ? raw
              : [raw]
            : []
          : Array.isArray(raw)
          ? raw
          : [];
        if (!selected.length) return null;
        return selected.map((opt: any) => ({
          name: attr.name,
          value: opt.label,
          id: opt.id,
          code: attr.code,
        }));
      })
      .filter((item) => item !== null) as Array<
      Array<{ name: string; value: string; id: number; code: string }>
    >;

    if (!lists.length) return [];
    return cartesian(...lists);
  })();

  // Keep variation_options array length in sync with cartesian product (avoid submitting stale rows when selection shrinks)
  const cartesianLengthRef = useRef<number>(0);
  useEffect(() => {
    const len = cartesianProduct.length;
    if (len === cartesianLengthRef.current) return;
    cartesianLengthRef.current = len;
    if (len === 0) {
      // When editing, keep existing variation_options until eav_variant_dimensions is populated (don't wipe pre-filled data)
      const current = (getValues('variation_options') ?? []) as any[];
      if (initialValues?.id && current.length > 0) return;
      setValue('variation_options', [], { shouldDirty: true });
      return;
    }
    const current = (getValues('variation_options') ?? []) as any[];
    const next = Array.from({ length: len }, (_, i) =>
      current[i] != null ? { ...current[i] } : {},
    );
    setValue('variation_options', next, { shouldDirty: true });
  }, [cartesianProduct.length, setValue, getValues, initialValues?.id]);

  const variationSectionTitle = isSingleProduct
    ? t('form:form-title-single-product-options') || 'Select one option per attribute'
    : t('form:form-title-variation-product-info');
  const variationSectionDetails = isSingleProduct
    ? (t('form:form-description-single-product-options') ||
        'Choose one value for each option (e.g. one size, one color). This product will have a single SKU.')
    : `${initialValues ? t('form:item-description-update') : t('form:item-description-choose')} ${t('form:form-description-variation-product-info')}`;

  return (
    <ProductFormSection
      title={variationSectionTitle}
      details={variationSectionDetails}
      cardClassName="p-0 md:p-0"
    >
      <div className="mb-5 md:mb-8">
          <Title className="mt-8 mb-0 px-5 text-center text-lg uppercase md:px-8">
            {isSingleProduct
              ? (t('form:form-title-options-single') || 'Options (select one per attribute)')
              : t('form:form-title-options')}
          </Title>

          {/* Select values for each EAV variant attribute (e.g. Size, Color) */}
          <div>
            {sortedVariantAttributes.map((attr, index) => (
              <div
                key={attr.code}
                className="border-b border-dashed border-border-200 p-5 last:border-0 md:p-8"
              >
                <div className="flex items-center justify-between">
                  <Title className="mb-0">
                    {t('form:form-title-options')} {index + 1}
                  </Title>
                </div>

                <div className="grid grid-cols-fit gap-5">
                  <div className="mt-5">
                    <Label>{attr.is_mandatory ? `${attr.name}*` : attr.name}</Label>
                    <SelectInput
                      name={`eav_variant_dimensions.${index}.selectedOptions`}
                      control={control}
                      defaultValue={initialDimensions[index]?.selectedOptions ?? []}
                      isMulti={!isSingleProduct}
                      // @ts-ignore
                      options={attr.options}
                      getOptionLabel={(option: any) => option.label}
                      getOptionValue={(option: any) => option.id}
                      placeholder={t('form:text-select')}
                      error={t(
                        (errors.eav_variant_dimensions as any)?.[index]
                          ?.selectedOptions?.message,
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview / variant rows */}
          {!!cartesianProduct?.length && (
            <div className="mt-5 border-t border-dashed border-border-200 pt-5 md:mt-8 md:pt-8">
              <Title className="mb-0 px-5 text-center text-lg uppercase md:px-8">
                {cartesianProduct?.length} {t('form:total-variation-added')}
              </Title>
              {cartesianProduct.map(
                (fieldAttributeValue: any, index: number) => {
                  const is_update_message = watch(
                    `variation_options.${index}.inform_purchased_customer`,
                  );
                  return (
                    <div
                      key={`fieldAttributeValues-eav-${index}`}
                      className="mt-5 mb-5 border-b border-dashed border-border-200 p-5 last:mb-8 last:border-0 md:p-8 md:last:pb-0"
                    >
                      <Title className="mb-8 !text-lg">
                        {t('form:form-title-variant')}:{' '}
                        <span className="font-normal text-blue-600">
                          {Array.isArray(fieldAttributeValue)
                            ? fieldAttributeValue
                                ?.map((a) => a.value)
                                .join('/')
                            : fieldAttributeValue?.title}

                          {isObject(fieldAttributeValue)
                            ? // @ts-ignore
                              fieldAttributeValue?.value
                            : ''}
                        </span>
                      </Title>

                      {/* Hidden title and options JSON (includes code + id) */}
                      <TitleAndOptionsInput
                        register={register}
                        setValue={setValue}
                        index={index}
                        fieldAttributeValue={fieldAttributeValue}
                      />

                      <input
                        {...register(`variation_options.${index}.id`)}
                        type="hidden"
                      />

                      <div className="grid grid-cols-2 gap-5">
                        <Input
                          label={`${t('form:input-label-price')}*`}
                          type="number"
                          {...register(`variation_options.${index}.price`)}
                          error={t(
                            // @ts-ignore
                            errors.variation_options?.[index]?.price?.message,
                          )}
                          variant="outline"
                          className="mb-5"
                        />
                        <Input
                          label={`${t('form:input-label-sale-price')}*`}
                          type="number"
                          {...register(`variation_options.${index}.sale_price`)}
                          error={t(
                            // @ts-ignore
                            errors.variation_options?.[index]?.sale_price
                              ?.message,
                          )}
                          variant="outline"
                          className="mb-5"
                        />
                        <Input
                          label={`${t('form:input-label-sku')}*`}
                          note={
                            Config.enableMultiLang
                              ? `${t('form:input-note-multilang-sku')}`
                              : ''
                          }
                          {...register(`variation_options.${index}.sku`)}
                          error={t(
                            // @ts-ignore
                            errors.variation_options?.[index]?.sku?.message,
                          )}
                          variant="outline"
                          className="mb-5"
                        />
                        <Input
                          label={`${t('form:input-label-quantity')}*`}
                          type="number"
                          {...register(`variation_options.${index}.quantity`)}
                          error={t(
                            // @ts-ignore
                            errors.variation_options?.[index]?.quantity
                              ?.message,
                          )}
                          variant="outline"
                          className="mb-5"
                        />
                      </div>
                      <div>
                        <Label>
                          {t('form:input-label-image')}
                          {' and size should not be more than'} &nbsp;
                          {upload_max_filesize}
                          {'MB '}
                        </Label>
                        <FileInput
                          name={`variation_options.${index}.image`}
                          control={control}
                          multiple={false}
                        />
                      </div>
                      <div className="mt-5 mb-5">
                        <Checkbox
                          {...register(`variation_options.${index}.is_digital`)}
                          label={t('form:input-label-is-digital')}
                        />
                        {!!watch(`variation_options.${index}.is_digital`) && (
                          <div className="mt-5">
                            <Label>{t('form:input-label-digital-file')}</Label>
                            <FileInput
                              name={`variation_options.${index}.digital_file_input`}
                              control={control}
                              multiple={false}
                              acceptFile={true}
                              helperText={t('form:text-upload-digital-file')}
                            />
                            {options?.enableEmailForDigitalProduct ? (
                              <div className="mt-5 mb-5">
                                <Checkbox
                                  {...register(
                                    `variation_options.${index}.inform_purchased_customer`,
                                  )}
                                  id={`variation_options.${index}.inform_purchased_customer`}
                                  label="Send email to already purchased customer of this item about this update."
                                  className="mb-5"
                                />
                                {is_update_message ? (
                                  <TextArea
                                    {...register(
                                      `variation_options.${index}.product_update_message`,
                                    )}
                                    id={`variation_options.${index}.product_update_message`}
                                    label="You can send message towards customer about this update."
                                    variant="outline"
                                    className="col-span-2"
                                    placeholder="(Optional)"
                                  />
                                ) : null}
                              </div>
                            ) : null}

                            {
                              // @ts-ignore
                              errors?.variation_options?.[index]
                                ?.digital_file_input && (
                                <ValidationError
                                  message={t(
                                    'form:error-digital-file-is-required',
                                  )}
                                />
                              )
                            }

                            <Alert
                              message={t('form:info-about-digital-product')}
                              variant="info"
                              closeable={false}
                              className="mt-5 mb-5"
                            />

                            <input
                              type="hidden"
                              {...register(
                                `variation_options.${index}.digital_files`,
                              )}
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-5 mb-5">
                        <Checkbox
                          {...register(`variation_options.${index}.is_disable`)}
                          error={t(
                            // @ts-ignore
                            errors.variation_options?.[index]?.is_disable
                              ?.message,
                          )}
                          label={t('form:input-label-disable-variant')}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
    </ProductFormSection>
  );
}

