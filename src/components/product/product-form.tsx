import Input from '@/components/ui/input';
import TextArea from '@/components/ui/text-area';
import {
  useForm,
  useFieldArray,
  FormProvider,
  Controller,
} from 'react-hook-form';
import Button from '@/components/ui/button';
import ProductFormSection from '@/components/product/product-form-section';
import Label from '@/components/ui/label';
import Radio from '@/components/ui/radio/radio';
import { useRouter } from 'next/router';
import { yupResolver } from '@hookform/resolvers/yup';
import FileInput from '@/components/ui/file-input';
import { productValidationSchema } from '@/components/product/product-validation-schema';
import ProductVariableForm from '@/components/product/product-variable-form';
import ProductVariableEavForm from '@/components/product/product-variable-eav-form';
import ProductSimpleForm from '@/components/product/product-simple-form';
import ProductGroupInput from '@/components/product/product-group-input';
// import ProductCategoryInput from '@/components/product/product-category-input';
import ProductCategoryCascader from '@/components/product/product-category-cascader';
import ProductEavAttributes from '@/components/product/product-eav-attributes';
import ProductTypeInput from '@/components/product/product-type-input';
import {
  ProductType,
  Product,
  ProductStatus,
  getVariantAttributesFromTemplate,
  AttributeTemplateResponse,
} from '@/types';
import { useTranslation } from 'next-i18next';
import { useShopQuery } from '@/data/shop';
import cn from 'classnames';
import ProductTagInput from '@/components/product/product-tag-input';
import { Config } from '@/config';
import Alert from '@/components/ui/alert';
import { useEffect, useMemo, useRef, useState, lazy } from 'react';
import ProductAuthorInput from '@/components/product/product-author-input';
import { EditIcon } from '@/components/icons/edit';
import {
  getProductDefaultValues,
  getProductInputValues,
  ProductFormValues,
} from '@/components/product/form-utils';
import { getErrorMessage } from '@/utils/form-error';
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useProductAttributeTemplateByCategoryQuery,
} from '@/data/product';
import { isEmpty } from 'lodash';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import { useSettingsQuery } from '@/data/settings';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useCallback } from 'react';
import OpenAIButton from '@/components/openAI/openAI.button';
import { ItemProps } from '@/types';
import { LongArrowPrev } from '@/components/icons/long-arrow-prev';
import { formatSlug } from '@/utils/use-slug';
import ProductFlashSaleBox from '@/components/product/product-flash-sale-box';
import { UpdateIcon } from '@/components/icons/update';
import StickyFooterPanel from '@/components/ui/sticky-footer-panel';
import { ProductDescriptionSuggestion } from '@/components/product/product-ai-prompt';
import RichTextEditor from '@/components/ui/wysiwyg-editor/editor';
import TooltipLabel from '@/components/ui/tooltip-label';

type ProductFormProps = {
  initialValues?: Product | null;
};

const sortBySortOrder = <T extends { sort_order?: number }>(items: T[] = []) =>
  [...items].sort(
    (a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER),
  );

const sortAttributeTemplate = (
  template?: AttributeTemplateResponse,
): AttributeTemplateResponse | undefined => {
  if (!template) return template;
  const sortAttributes = (attributes?: any[]) =>
    attributes == null
      ? undefined
      :
    sortBySortOrder(attributes).map((attribute: any) => ({
      ...attribute,
      options: sortBySortOrder(attribute.options ?? []),
    }));

  return {
    ...template,
    product_attributes: sortAttributes(template.product_attributes),
    variant_attributes: sortAttributes(template.variant_attributes),
    variant_options: sortAttributes(template.variant_options),
  };
};

const getAttributeTemplateCodes = (
  template?: AttributeTemplateResponse | null,
) => {
  if (!template) return { allCodes: [], variantCodes: [] };
  const variantAttributes = getVariantAttributesFromTemplate(template);
  const productCodes = (template.product_attributes ?? []).map(
    (attribute) => attribute.code,
  );
  const variantCodes = variantAttributes.map((attribute) => attribute.code);
  return {
    allCodes: Array.from(new Set([...productCodes, ...variantCodes])),
    variantCodes,
  };
};

const getTemplateErrorStatus = (error: unknown) =>
  (error as any)?.response?.status;

export default function CreateOrUpdateProductForm({
  initialValues,
}: ProductFormProps) {
  const router = useRouter();
  const { locale } = router;
  const { settings } = useSettingsQuery({
    language: locale!,
  });
  // Safely extract options to avoid runtime error when settings is undefined
  const options = settings?.options || {};
  const [isSlugDisable, setIsSlugDisable] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useTranslation();
  const { openModal } = useModalAction();
  const { permissions } = getAuthCredentials();
  let permission = hasAccess(adminOnly, permissions);
  let statusList = [
    {
      label: 'form:input-label-under-review',
      id: 'under_review',
      value: ProductStatus.UnderReview,
    },
    {
      label: 'form:input-label-draft',
      id: 'draft',
      value: ProductStatus.Draft,
    },
  ];

  const { data: shopData } = useShopQuery(
    { slug: router.query.shop as string },
    {
      enabled: !!router.query.shop,
    },
  );
  const shopId = shopData?.id!;
  const isNewTranslation = router?.query?.action === 'translate';
  const isSlugEditable =
    router?.query?.action === 'edit' &&
    router?.locale === Config.defaultLanguage;
  const attributeTemplateRef = useRef<AttributeTemplateResponse | null>(null);
  const methods = useForm<ProductFormValues>({
    //@ts-ignore
    resolver: yupResolver(productValidationSchema),
    context: { attributeTemplateRef },
    shouldUnregister: true,
    // @ts-ignore
    defaultValues: getProductDefaultValues(initialValues!, isNewTranslation),
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = methods;

  const persistedFieldsRegistered = useRef(false);
  if (!persistedFieldsRegistered.current) {
    persistedFieldsRegistered.current = true;
    // Keep category cascade + EAV values even when their inputs are unmounted.
    // The form uses shouldUnregister: true (so unused simple/variable fields are
    // omitted from submit). Without this, edit drops `categories` / `eav_attributes`
    // because those values are set via defaultValues/setValue, not a mounted input.
    register('categories' as any, { shouldUnregister: false });
    register('eav_attributes' as any, { shouldUnregister: false });
    register('primary_category' as any, { shouldUnregister: false });
    register('secondary_category' as any, { shouldUnregister: false });
    register('tertiary_category' as any, { shouldUnregister: false });
    register('quaternary_category' as any, { shouldUnregister: false });
  }

  // When editing, reset form when product data loads/refetches (e.g. after Update
  // navigates back to the same edit URL). RHF only applies defaultValues on mount;
  // without resetting on updated_at, fields like sale_price stay stuck on the
  // pre-save cache snapshot while the product id is unchanged.
  useEffect(() => {
    if (initialValues?.id != null) {
      reset(
        getProductDefaultValues(initialValues, isNewTranslation) as Partial<ProductFormValues>,
        {
          keepDirtyValues: false,
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialValues?.id,
    (initialValues as any)?.updated_at,
    isNewTranslation,
  ]);

  const upload_max_filesize =
    (options?.server_info?.upload_max_filesize ?? 0) / 1024;

  const { mutate: createProduct, isLoading: creating } =
    useCreateProductMutation();
  const { mutate: updateProduct, isLoading: updating } =
    useUpdateProductMutation();

  const onSubmit = async (values: ProductFormValues) => {
    const inputValues = {
      language: router.locale,
      ...getProductInputValues(values, initialValues),
    };

    try {
      if (
        !initialValues ||
        !initialValues.translated_languages.includes(router.locale!)
      ) {
        const requestObject = {
          ...inputValues,
          ...(initialValues?.slug && { slug: initialValues.slug }),
          shop_id:
            shopId != null
              ? Number(shopId)
              : initialValues?.shop_id != null
              ? Number(initialValues.shop_id)
              : undefined,
        };
        console.log('Product Creation Request Object:', requestObject);
        //@ts-ignore
        createProduct(requestObject);
      } else {
        const requestObject = {
          ...inputValues,
          id: initialValues.id!,
          shop_id: initialValues.shop_id!,
        };
        console.log('Product Update Request Object:', requestObject);
        //@ts-ignore
        updateProduct(requestObject);
      }
    } catch (error) {
      const serverErrors = getErrorMessage(error);
      Object.keys(serverErrors?.validation).forEach((field: any) => {
        setError(field.split('.')[1], {
          type: 'manual',
          message: serverErrors?.validation[field][0],
        });
      });
    }
  };

  const product_type = watch('product_type');
  const is_digital = watch('is_digital');
  const is_external = watch('is_external');
  const selectedCategories = watch('categories');
  const watchedPrimaryCategory = watch('primary_category');
  const watchedSecondaryCategory = watch('secondary_category');
  const watchedTertiaryCategory = watch('tertiary_category');
  const watchedQuaternaryCategory = watch('quaternary_category');
  const primaryCategoryId =
    Array.isArray(selectedCategories) && selectedCategories.length > 0
      ? selectedCategories[0]?.id
      : undefined;
  const hasPartialCategorySelection =
    !primaryCategoryId &&
    Boolean(
      watchedPrimaryCategory ||
        watchedSecondaryCategory ||
        watchedTertiaryCategory ||
        watchedQuaternaryCategory,
    );

  const {
    template: attributeTemplate,
    loading: attributeTemplateLoading,
    error: attributeTemplateError,
    refetch: refetchAttributeTemplate,
  } = useProductAttributeTemplateByCategoryQuery(primaryCategoryId);
  const sortedAttributeTemplate = useMemo(
    () => sortAttributeTemplate(attributeTemplate),
    [attributeTemplate],
  );
  attributeTemplateRef.current = sortedAttributeTemplate ?? null;
  const templateErrorStatus = getTemplateErrorStatus(attributeTemplateError);
  const isMissingAttributeTemplate = templateErrorStatus === 404;
  const hasAttributeTemplateError =
    Boolean(attributeTemplateError) && !isMissingAttributeTemplate;
  const templateCodes = useMemo(
    () => getAttributeTemplateCodes(sortedAttributeTemplate),
    [sortedAttributeTemplate],
  );
  const hasDynamicAttributes =
    templateCodes.allCodes.length > 0 || templateCodes.variantCodes.length > 0;

  const previousLeafCategoryIdRef = useRef<string | number | undefined>();
  const previousVariantCodesRef = useRef<string>('');

  useEffect(() => {
    if (!primaryCategoryId) {
      setValue('eav_attribute_template_codes', []);
      setValue('eav_variant_attribute_codes', []);
      return;
    }

    if (!sortedAttributeTemplate) {
      if (isMissingAttributeTemplate) {
        setValue('eav_attribute_template_codes', []);
        setValue('eav_variant_attribute_codes', []);
        previousLeafCategoryIdRef.current = primaryCategoryId;
        previousVariantCodesRef.current = '';
      }
      return;
    }

    const previousLeafCategoryId = previousLeafCategoryIdRef.current;
    const categoryChanged =
      previousLeafCategoryId != null &&
      String(previousLeafCategoryId) !== String(primaryCategoryId);
    const allCodeSet = new Set(templateCodes.allCodes);
    const currentAttributes = (methods.getValues('eav_attributes') ?? {}) as Record<
      string,
      unknown
    >;
    const staleAttributeCodes = Object.keys(currentAttributes).filter(
      (code) => !allCodeSet.has(code),
    );
    const nextVariantCodes = templateCodes.variantCodes.join('|');
    const variantSetChanged =
      previousVariantCodesRef.current !== '' &&
      previousVariantCodesRef.current !== nextVariantCodes;
    const shouldConfirm =
      Boolean(initialValues?.id) &&
      categoryChanged &&
      (staleAttributeCodes.length > 0 || variantSetChanged);
    const canClear =
      !shouldConfirm ||
      window.confirm(
        'Changing category will remove attribute values that are not available in the selected category. Continue?',
      );

    setValue('eav_attribute_template_codes', templateCodes.allCodes);
    setValue('eav_variant_attribute_codes', templateCodes.variantCodes);

    if (canClear && staleAttributeCodes.length > 0) {
      const filteredAttributes = Object.fromEntries(
        Object.entries(currentAttributes).filter(([code]) => allCodeSet.has(code)),
      );
      setValue('eav_attributes', filteredAttributes as any, {
        shouldDirty: true,
      });
    }

    if (canClear && variantSetChanged) {
      setValue('eav_variant_dimensions', [], { shouldDirty: true });
      setValue('variation_options', [], { shouldDirty: true });
    }

    previousLeafCategoryIdRef.current = primaryCategoryId;
    previousVariantCodesRef.current = nextVariantCodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryCategoryId, sortedAttributeTemplate, isMissingAttributeTemplate]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'video',
  });
  const productName = watch('name');

  const productDescriptionSuggestionLists = useMemo(() => {
    return ProductDescriptionSuggestion({ name: productName ?? '' });
  }, [productName]);

  const handleGenerateDescription = useCallback(() => {
    openModal('GENERATE_DESCRIPTION', {
      control,
      name: productName,
      set_value: setValue,
      key: 'description',
      suggestion: productDescriptionSuggestionLists as ItemProps[],
    });
  }, [productName]);

  const slugAutoSuggest = formatSlug(watch('name'));
  if (Boolean(options?.isProductReview)) {
    if (permission) {
      if (initialValues?.status !== ProductStatus?.Draft) {
        statusList = [
          {
            label: 'form:input-label-published',
            id: 'published',
            value: ProductStatus.Publish,
          },
          {
            label: 'form:input-label-approved',
            id: 'approved',
            value: ProductStatus.Approved,
          },
          {
            label: 'form:input-label-rejected',
            id: 'rejected',
            value: ProductStatus.Rejected,
          },
          {
            label: 'form:input-label-soft-disabled',
            id: 'unpublish',
            value: ProductStatus.UnPublish,
          },
        ];
      } else {
        statusList = [
          {
            label: 'form:input-label-draft',
            id: 'draft',
            value: ProductStatus.Draft,
          },
        ];
      }
    } else {
      if (
        initialValues?.status === ProductStatus.Publish ||
        initialValues?.status === ProductStatus.Approved ||
        initialValues?.status === ProductStatus.UnPublish
      ) {
        {
          statusList = [
            {
              label: 'form:input-label-published',
              id: 'published',
              value: ProductStatus.Publish,
            },
            {
              label: 'form:input-label-unpublish',
              id: 'unpublish',
              value: ProductStatus.UnPublish,
            },
          ];
        }
      }
    }
  } else {
    statusList = [
      {
        label: 'form:input-label-published',
        id: 'published',
        value: ProductStatus.Publish,
      },
      {
        label: 'form:input-label-draft',
        id: 'draft',
        value: ProductStatus.Draft,
      },
    ];
  }

  const featuredImageInformation = (
    <span>
      {t('form:featured-image-help-text')} <br />
      {t('form:size-help-text')} &nbsp;
      <span className="font-bold">{upload_max_filesize} MB </span>
    </span>
  );

  const galleryImageInformation = (
    <span>
      {t('form:gallery-help-text')} <br />
      {t('form:size-help-text')} &nbsp;
      <span className="font-bold">{upload_max_filesize} MB </span>
    </span>
  );

  const {
    fields: variationsFiled,
    append: variationsAppend,
    remove: variationsRemove,
  } = useFieldArray({
    shouldUnregister: true,
    control,
    name: 'variations',
  });

  return (
    <>
      {errorMessage ? (
        <Alert
          message={t(`common:${errorMessage}`)}
          variant="error"
          closeable={true}
          className="mt-5"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Controller
            name={'categories' as any}
            control={control}
            shouldUnregister={false}
            render={() => null}
          />
          <Controller
            name={'eav_attributes' as any}
            control={control}
            shouldUnregister={false}
            render={() => null}
          />
          <Controller
            name={'secondary_category' as any}
            control={control}
            shouldUnregister={false}
            render={() => null}
          />
          <Controller
            name={'tertiary_category' as any}
            control={control}
            shouldUnregister={false}
            render={() => null}
          />
          <Controller
            name={'quaternary_category' as any}
            control={control}
            shouldUnregister={false}
            render={() => null}
          />
          <ProductFormSection
            title={t('form:featured-image-title')}
            details={featuredImageInformation}
          >
            <FileInput name="image" control={control} multiple={false} />
          </ProductFormSection>

          <ProductFormSection
            title={t('form:gallery-title')}
            details={galleryImageInformation}
          >
            <FileInput name="gallery" control={control} />
          </ProductFormSection>

          <ProductFormSection
            title={t('form:video-title')}
            details={t('form:video-help-text')}
          >
              {/* Video url picker */}
              <div>
                {fields?.map((item: any, index: number) => (
                  <div
                    className="py-5 border-b border-dashed border-border-200 first:pt-0 last:border-b-0 md:py-8 md:first:pt-0"
                    key={index}
                  >
                    {' '}
                    <div className="flex gap-1 mb-3 text-sm font-semibold leading-none text-body-dark">
                      {`${t('form:input-label-video-embed')} ${index + 1}`}
                      <TooltipLabel toolTipText={'form:text-video-tooltip'} />
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
                      <TextArea
                        className="sm:col-span-4"
                        variant="outline"
                        {...register(`video.${index}.url` as const)}
                        defaultValue={item?.url!}
                        // @ts-ignore
                        error={t(errors?.video?.[index]?.url?.message)}
                      />
                      <button
                        onClick={() => {
                          remove(index);
                        }}
                        type="button"
                        className="text-sm text-red-500 transition-colors duration-200 hover:text-red-700 focus:outline-none sm:col-span-1"
                      >
                        {t('form:button-label-remove')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={() => {
                  append({ url: '' });
                }}
                className="w-full sm:w-auto"
              >
                {t('form:button-label-add-video')}
              </Button>
          </ProductFormSection>

          <ProductFormSection
            title={t('form:type-and-category')}
            details={t('form:type-and-category-help-text')}
          >
              <ProductGroupInput
                control={control}
                error={t((errors?.type as any)?.message)}
              />
              <ProductCategoryCascader control={control} setValue={setValue} />
              {/* Authors – commented out per requirement
              <ProductAuthorInput control={control} />
              */}
              <ProductTagInput control={control} setValue={setValue} />
          </ProductFormSection>

          <ProductFormSection
            title={t('form:item-description')}
            details={`${
              initialValues
                ? t('form:item-description-edit')
                : t('form:item-description-add')
            } ${t('form:product-description-help-text')}`}
          >
              <Input
                label={`${t('form:input-label-name')}*`}
                {...register('name')}
                error={t(errors.name?.message!)}
                variant="outline"
                className="mb-5"
              />

              {isSlugEditable ? (
                <div className="relative mb-5">
                  <Input
                    label={t('form:input-label-slug')}
                    {...register('slug')}
                    error={t(errors.slug?.message!)}
                    variant="outline"
                    disabled={isSlugDisable}
                  />
                  <button
                    className="absolute top-[27px] right-px z-0 flex h-[46px] w-11 items-center justify-center rounded-tr rounded-br border-l border-solid border-border-base bg-white px-2 text-body transition duration-200 hover:text-heading focus:outline-none"
                    type="button"
                    title={t('common:text-edit')}
                    onClick={() => setIsSlugDisable(false)}
                  >
                    <EditIcon width={14} />
                  </button>
                </div>
              ) : (
                <Input
                  label={t('form:input-label-slug')}
                  {...register('slug')}
                  value={slugAutoSuggest}
                  variant="outline"
                  className="mb-5"
                  disabled
                />
              )}
              {/* Unit – not required; commented out per requirement
              <Input
                label={t('form:input-label-unit')}
                {...register('unit')}
                error={t(errors.unit?.message!)}
                variant="outline"
                className="mb-5"
              />
              */}
              <div className="relative mb-5">
                {options?.useAi && (
                  <OpenAIButton
                    title={t('form:button-label-description-ai')}
                    onClick={handleGenerateDescription}
                  />
                )}
                <RichTextEditor
                  title={t('form:input-label-description')}
                  control={control}
                  name="description"
                  error={t(errors?.description?.message)}
                />
              </div>

              <div>
                <Label>{t('form:input-label-status')}*</Label>
                {!isEmpty(statusList)
                  ? statusList?.map((status: any, index: number) => (
                      <Radio
                        key={index}
                        {...register('status')}
                        label={t(status?.label)}
                        id={status?.id}
                        value={status?.value}
                        className="mb-2"
                        disabled={
                          permission &&
                          initialValues?.status === ProductStatus?.Draft
                            ? true
                            : false
                        }
                      />
                    ))
                  : ''}
                {errors.status?.message && (
                  <p className="my-2 text-xs text-red-500">
                    {t(errors?.status?.message!)}
                  </p>
                )}
              </div>
          </ProductFormSection>

          {initialValues?.in_flash_sale ? (
            <ProductFormSection
              title="Promotional"
              details="Product selected for this campaign."
            >
              <ProductFlashSaleBox
                initialValues={initialValues}
                shop={shopData}
              />
            </ProductFormSection>
          ) : (
            <ProductFormSection
              title="Promotional"
              details="Select product promotional settings form here"
            >
              <Alert message={'Product is not selected in any campaign.'} />
            </ProductFormSection>
          )}

          <ProductFormSection
            title={t('form:form-title-product-type')}
            details={t('form:form-description-product-type')}
          >
            <ProductTypeInput />
          </ProductFormSection>

          {hasPartialCategorySelection && (
            <div className="mb-5 rounded border border-border-200 bg-light p-5 text-sm text-body md:p-8">
              Select a sub-category to load product attributes.
            </div>
          )}

          {primaryCategoryId && hasAttributeTemplateError && (
            <Alert
              message="Unable to load product attributes. Please try again."
              variant="error"
              closeable={false}
              className="mb-5"
            />
          )}
          {primaryCategoryId && hasAttributeTemplateError && (
            <Button
              type="button"
              onClick={() => refetchAttributeTemplate?.()}
              className="mb-5"
            >
              Retry loading attributes
            </Button>
          )}

          {primaryCategoryId &&
            !attributeTemplateLoading &&
            (isMissingAttributeTemplate ||
              (sortedAttributeTemplate && !hasDynamicAttributes)) && (
              <div className="mb-5 rounded border border-border-200 bg-light p-5 text-sm text-body md:p-8">
                No product attributes are configured for this category.
              </div>
            )}

          {/* Product-level EAV attributes; for simple product, variant attributes (size, color) as single-select */}
          {primaryCategoryId && sortedAttributeTemplate && (
            <ProductEavAttributes
              template={sortedAttributeTemplate}
              productType={product_type?.value}
            />
          )}

          {/* Single Type: always simple payload. Show price/sku/quantity; variant attributes (size, color) shown above in ProductEavAttributes as single-select. */}
          {product_type?.value === ProductType.Single && (
            <ProductSimpleForm
              initialValues={initialValues}
              settings={options}
            />
          )}

          {/* Variable Type: multi-select variant attributes, cartesian product of options */}
          {product_type?.value === ProductType.Variable &&
            (() => {
              if (hasPartialCategorySelection || hasAttributeTemplateError) {
                return null;
              }
              // Wait for attribute template to load before deciding which variation form to render.
              // Without this guard, ProductVariableForm mounts while template is loading, then gets
              // replaced by ProductVariableEavForm causing form state issues.
              // Also wait when category exists but template hasn't arrived yet (query may be idle/starting).
              if (
                primaryCategoryId &&
                (attributeTemplateLoading ||
                  (!sortedAttributeTemplate && !isMissingAttributeTemplate))
              ) {
                return (
                  <div className="flex items-center justify-center py-10 text-sm text-body">
                    {t('common:text-loading')}...
                  </div>
                );
              }
              const variantAttributes = getVariantAttributesFromTemplate(
                sortedAttributeTemplate,
              );
              return variantAttributes.length > 0 ? (
                <ProductVariableEavForm
                  shopId={shopId}
                  initialValues={initialValues}
                  variantAttributes={variantAttributes}
                />
              ) : (
                <ProductVariableForm
                  shopId={shopId}
                  initialValues={initialValues}
                  settings={options}
                  name="variations"
                  fields={variationsFiled}
                  // @ts-ignore
                  append={variationsAppend}
                  remove={variationsRemove}
                />
              );
            })()}

            
          <StickyFooterPanel className="z-0">
            <div
              className={cn(
                'flex items-center',
                initialValues ? 'justify-between' : 'justify-end',
              )}
            >
              {initialValues && (
                <Button
                  variant="custom"
                  onClick={router.back}
                  className="!px-0 text-sm !text-body me-4 hover:!text-accent focus:ring-0 md:text-base"
                  type="button"
                  size="medium"
                >
                  <LongArrowPrev className="w-4 h-5 me-2" />
                  {t('form:button-label-back')}
                </Button>
              )}
              <div className="flex items-center">
                <Button
                  type="submit"
                  loading={updating || creating}
                  disabled={updating || creating}
                  size="medium"
                  className="text-sm md:text-base"
                >
                  {initialValues ? (
                    <>
                      <UpdateIcon className="w-5 h-5 shrink-0 ltr:mr-2 rtl:pl-2" />
                      <span className="sm:hidden">
                        {t('form:button-label-update')}
                      </span>
                      <span className="hidden sm:block">
                        {t('form:button-label-update-product')}
                      </span>
                    </>
                  ) : (
                    t('form:button-label-add-product')
                  )}
                </Button>
              </div>
            </div>
          </StickyFooterPanel>
          {/* <div className="fixed inset-x-0 left-auto bottom-0 w-full bg-white py-5 px-8 lg:w-[calc(100%-288px)]">
            <div className="flex items-center justify-between">
              {initialValues && (
                <Button
                  variant="custom"
                  onClick={router.back}
                  className="!px-0 !text-body me-4 focus:ring-0"
                  type="button"
                  size="medium"
                >
                  <LongArrowPrev className="w-5 h-5 me-2" />
                  {t('form:button-label-back')}
                </Button>
              )}
              <div className="flex items-center">
                <Link
                  href={`${process.env.NEXT_PUBLIC_SHOP_URL}/products/preview/${query.productSlug}`}
                  target="_blank"
                  className="inline-flex h-12 flex-shrink-0 items-center justify-center rounded border !border-accent bg-transparent px-5 py-0 font-semibold leading-none !text-accent outline-none transition duration-300 ease-in-out me-4 hover:border-accent hover:bg-accent hover:!text-white focus:shadow focus:outline-none focus:ring-1 focus:ring-accent-700"
                >
                  <EyeIcon className="w-4 h-4 me-2" />
                  {t('form:button-label-preview-product-on-shop')}
                </Link>
                <Button loading={updating || creating} size="medium">
                  {initialValues
                    ? t('form:button-label-update-product')
                    : t('form:button-label-add-product')}
                </Button>
              </div>
            </div>
          </div> */}
        </form>
      </FormProvider>
    </>
  );
}
