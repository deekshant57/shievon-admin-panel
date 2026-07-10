import Input from '@/components/ui/input';
import {
  Control,
  FieldErrors,
  useForm,
  useFormState,
  useWatch,
} from 'react-hook-form';
import ActionButton from '@/components/ui/action-button';
import TextArea from '@/components/ui/text-area';
import Label from '@/components/ui/label';
import CategoryFormSection from '@/components/category/category-form-section';
import * as categoriesIcon from '@/components/icons/category';
import { EditIcon } from '@/components/icons/edit';
import { getIcon } from '@/utils/get-icon';
import { useRouter } from 'next/router';
import { Config } from '@/config';
import ValidationError from '@/components/ui/form-validation-error';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Category, ItemProps } from '@/types';
import { categoryIcons } from './category-icons';
import { useTranslation } from 'next-i18next';
import FileInput from '@/components/ui/file-input';
import SelectInput from '@/components/ui/select-input';
import { yupResolver } from '@hookform/resolvers/yup';
import { categoryValidationSchema } from './category-validation-schema';
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '@/data/category';
import { useTypesQuery } from '@/data/type';
import { useSettingsQuery } from '@/data/settings';
import { useModalAction } from '@/components/ui/modal/modal.context';
import OpenAIButton from '@/components/openAI/openAI.button';
import { join, split } from 'lodash';
import { formatSlug } from '@/utils/use-slug';
import StickyFooterPanel from '@/components/ui/sticky-footer-panel';
import { CategoryDetailSuggestion } from '@/components/category/category-ai-prompt';

export const updatedIcons = categoryIcons.map((item: any) => {
  item.label = (
    <div className="flex items-center space-s-5">
      <span className="flex items-center justify-center w-5 h-5">
        {getIcon({
          iconList: categoriesIcon,
          iconName: item.value,
          className: 'max-h-full max-w-full',
        })}
      </span>
      <span>{item.label}</span>
    </div>
  );
  return item;
});

function SelectTypes({
  control,
  errors,
}: {
  control: Control<FormValues>;
  errors: FieldErrors;
}) {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const { types, loading } = useTypesQuery({ language: locale });
  return (
    <div className="mb-5">
      <Label>{t('form:input-label-types')}</Label>
      <SelectInput
        name="type"
        control={control}
        getOptionLabel={(option: any) => option.name}
        getOptionValue={(option: any) => option.slug}
        options={types!}
        isLoading={loading}
      />
      <ValidationError message={t(errors.type?.message)} />
    </div>
  );
}

function SelectCategories({
  control,
  setValue,
  initialValue,
}: {
  control: Control<FormValues>;
  setValue: any;
  initialValue?: Category;
}) {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const type = useWatch({
    control,
    name: 'type',
  });
  const { dirtyFields } = useFormState({
    control,
  });
  useEffect(() => {
    if (type?.slug && dirtyFields?.type) {
      setValue('parent', []);
    }
  }, [type?.slug]);
  const { categories, loading } = useCategoriesQuery({
    limit: 999,
    type: type?.slug,
    language: locale,
    ...(Boolean(initialValue?.id) && { self: initialValue?.id }),
  });
  return (
    <div>
      <Label>{t('form:input-label-parent-category')}</Label>
      <SelectInput
        name="parent"
        control={control}
        getOptionLabel={(option: any) =>
          option?.slug ? `${option.name} (${option.slug})` : option.name
        }
        getOptionValue={(option: any) => option.id}
        options={categories}
        isClearable={true}
        isLoading={loading}
      />
    </div>
  );
}

type FormValues = {
  name: string;
  slug: string;
  details: string;
  parent: any;
  image: any;
  icon: any;
  type: any;
};

const defaultValues = {
  image: [],
  name: '',
  slug: '',
  details: '',
  parent: '',
  icon: '',
  type: '',
};

type IProps = {
  initialValues?: Category | undefined;
};
export default function CreateOrUpdateCategoriesForm({
  initialValues,
}: IProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const [isSlugDisable, setIsSlugDisable] = useState<boolean>(true);

  const isNewTranslation = router?.query?.action === 'translate';
  const isSlugEditable =
    router?.query?.action === 'edit' &&
    router?.locale === Config.defaultLanguage;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,

    formState: { errors },
  } = useForm<FormValues>({
    // shouldUnregister: true,
    //@ts-ignore
    defaultValues: initialValues
      ? {
          ...initialValues,
          icon: initialValues?.icon
            ? categoryIcons.find(
                (singleIcon) => singleIcon.value === initialValues?.icon!,
              )
            : '',
          ...(isNewTranslation && {
            type: null,
          }),
        }
      : defaultValues,
    //@ts-ignore
    resolver: yupResolver(categoryValidationSchema),
  });

  const { openModal } = useModalAction();
  const watchedParent = watch('parent');
  const slugAutoSuggest =
    watchedParent?.slug && watch('name')
      ? formatSlug(`${watchedParent.slug}-${watch('name')}`)
      : formatSlug(watch('name'));
  useEffect(() => {
    // Keep form slug in sync with auto suggestion while slug is not manually editable.
    if (!isSlugEditable || isSlugDisable) {
      setValue('slug', slugAutoSuggest);
    }
  }, [isSlugEditable, isSlugDisable, setValue, slugAutoSuggest]);
  const { locale } = router;
  const {
    // @ts-ignore
    settings: { options },
  } = useSettingsQuery({
    language: locale!,
  });

  const generateName = watch('name');
  const categoryDetailSuggestionLists = useMemo(() => {
    return CategoryDetailSuggestion({ name: generateName ?? '' });
  }, [generateName]);

  const handleGenerateDescription = useCallback(() => {
    openModal('GENERATE_DESCRIPTION', {
      control,
      name: generateName,
      set_value: setValue,
      key: 'details',
      suggestion: categoryDetailSuggestionLists as ItemProps[],
    });
  }, [generateName]);

  const { mutate: createCategory, isLoading: creating } =
    useCreateCategoryMutation();
  const { mutate: updateCategory, isLoading: updating } =
    useUpdateCategoryMutation();

  const onSubmit = async (values: FormValues) => {
    const imageId =
      values?.image?.id != null ? Number(values.image.id) : null;
    const parentId =
      values.parent?.id != null ? Number(values.parent.id) : null;
    const hasExplicitSlug =
      typeof values.slug === 'string' && values.slug.trim().length > 0;
    const resolvedSlug = hasExplicitSlug
      ? formatSlug(values.slug.trim())
      : parentId != null && values.parent?.slug
        ? formatSlug(`${values.parent.slug}-${values.name}`)
        : formatSlug(values.name);
    const baseInput = {
      language: router.locale,
      name: values.name,
      slug: resolvedSlug,
      details: values.details,
      icon: values.icon?.value || '',
      // Backend expects parent_id (not parent object) for hierarchy linkage.
      parent_id: parentId,
      type_id: values.type?.id,
    };
    if (
      !initialValues ||
      !initialValues.translated_languages.includes(router.locale!)
    ) {
      createCategory({
        ...baseInput,
        // Backend persists category image via image_id.
        image_id: imageId,
        ...(initialValues?.slug && { slug: initialValues.slug }),
      });
    } else {
      updateCategory({
        ...baseInput,
        image_id: imageId,
        id: initialValues.id!,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <CategoryFormSection
        title={t('form:input-label-image')}
        details={t('form:category-image-helper-text')}
      >
        <FileInput
          name="image"
          control={control}
          multiple={false}
          skipDeleteOnRemove
        />
      </CategoryFormSection>

      <CategoryFormSection
        title={t('form:input-label-description')}
        details={`${
          initialValues
            ? t('form:item-description-edit')
            : t('form:item-description-add')
        } ${t('form:category-description-helper-text')}`}
      >
        <Input
          label={t('form:input-label-name')}
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
              className="absolute top-[27px] end-px z-0 flex h-[46px] w-11 items-center justify-center rounded-e-md border-s border-border/60 bg-background px-2 text-body transition duration-200 hover:text-heading focus:outline-none"
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

        <div className="relative">
          {options?.useAi && (
            <OpenAIButton
              title={t('form:button-label-description-ai')}
              onClick={handleGenerateDescription}
            />
          )}
          <TextArea
            label={t('form:input-label-details')}
            {...register('details')}
            variant="outline"
            className="mb-5"
          />
        </div>

        <div className="mb-5">
          <Label>{t('form:input-label-select-icon')}</Label>
          <SelectInput
            name="icon"
            control={control}
            options={updatedIcons}
            isClearable={true}
          />
        </div>
        <SelectTypes control={control} errors={errors} />
        <SelectCategories
          control={control}
          setValue={setValue}
          initialValue={initialValues}
        />
      </CategoryFormSection>

      <StickyFooterPanel className="z-0">
        <div className="flex flex-col-reverse gap-3 text-end sm:flex-row sm:justify-end">
          {initialValues ? (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={router.back}
              type="button"
              className="w-full sm:w-auto"
            >
              {t('form:button-label-back')}
            </ActionButton>
          ) : null}

          <ActionButton
            type="submit"
            variant="primary"
            size="sm"
            loading={creating || updating}
            disabled={creating || updating}
            className="w-full sm:w-auto"
          >
            {initialValues
              ? t('form:button-label-update-category')
              : t('form:button-label-add-category')}
          </ActionButton>
        </div>
      </StickyFooterPanel>
    </form>
  );
}
