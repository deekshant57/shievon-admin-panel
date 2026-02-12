import SelectInput from '@/components/ui/select-input';
import Label from '@/components/ui/label';
import { Control, useFormContext, useFormState, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useCategoriesQuery } from '@/data/category';
import { useRouter } from 'next/router';
import { Category } from '@/types';

interface Props {
  control: Control<any>;
  setValue: any;
}

// Cascading category selector:
// Level 1: root categories for selected type
// Level 2: children of level 1
// Level 3: children of level 2
// Level 4: children of level 3
// The deepest selected level is written into `categories` as a single-element array.
const ProductCategoryCascader = ({ control, setValue }: Props) => {
  const { locale } = useRouter();
  const { t } = useTranslation('common');
  const { getValues } = useFormContext();

  // Watch selected product type (group) – may be full object { id, name, slug } or just id
  const type = useWatch({
    control,
    name: 'type',
  });

  const { dirtyFields } = useFormState({
    control,
  });

  // Resolve type id for API and filtering (form can store type as object or id)
  const typeId =
    type != null
      ? typeof type === 'object' && type.id != null
        ? Number(type.id)
        : Number(type)
      : undefined;
  const hasGroup = typeId != null && !Number.isNaN(typeId);

  // When type (group) changes or is cleared, reset all category-related fields
  useEffect(() => {
    if (!hasGroup) {
      setValue('categories', []);
      setValue('primary_category', null);
      setValue('secondary_category', null);
      setValue('tertiary_category', null);
      setValue('quaternary_category', null);
    } else if (dirtyFields?.type) {
      setValue('categories', []);
      setValue('primary_category', null);
      setValue('secondary_category', null);
      setValue('tertiary_category', null);
      setValue('quaternary_category', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  // Load categories only when a group is selected; filter by type_id so only categories under that group are returned
  const { categories: rawCategories, loading: loadingRoot } = useCategoriesQuery(
    {
      limit: 999,
      type_id: typeId,
      parent: null,
      language: locale,
    },
    { enabled: hasGroup },
  );

  // Filter by type_id client-side so only categories for the selected group are shown (in case backend returns all)
  const rootCategories =
    hasGroup && Array.isArray(rawCategories)
      ? (rawCategories as any[]).filter(
          (c: any) => c.type_id != null && Number(c.type_id) === typeId,
        )
      : rawCategories ?? [];

  // Watch cascading selections
  const primaryCategory = useWatch({
    control,
    name: 'primary_category',
  }) as Category | null;

  const secondaryCategory = useWatch({
    control,
    name: 'secondary_category',
  }) as Category | null;

  const tertiaryCategory = useWatch({
    control,
    name: 'tertiary_category',
  }) as Category | null;

  const quaternaryCategory = useWatch({
    control,
    name: 'quaternary_category',
  }) as Category | null;

  // Clear deeper levels when an upper level changes
  useEffect(() => {
    setValue('secondary_category', null);
    setValue('tertiary_category', null);
    setValue('quaternary_category', null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryCategory?.id]);

  useEffect(() => {
    setValue('tertiary_category', null);
    setValue('quaternary_category', null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondaryCategory?.id]);

  useEffect(() => {
    setValue('quaternary_category', null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tertiaryCategory?.id]);

  // Whenever any level changes, update the `categories` field only when the selection is "complete"
  useEffect(() => {
    const allCategories = Array.isArray(rootCategories) ? rootCategories : [];
    // Determine if there are further children for the current selections
    const hasLevel2Children =
      !!primaryCategory &&
      (allCategories as any[]).some(
        (c: any) => c.parent_id === Number(primaryCategory.id),
      );
    const hasLevel3Children =
      !!secondaryCategory &&
      (allCategories as any[]).some(
        (c: any) => c.parent_id === Number(secondaryCategory.id),
      );
    const hasLevel4Children =
      !!tertiaryCategory &&
      (allCategories as any[]).some(
        (c: any) => c.parent_id === Number(tertiaryCategory.id),
      );

    // Selection is considered complete only when there is no unselected deeper level
    let isComplete = false;

    if (primaryCategory && !hasLevel2Children) {
      // Only one level of categories
      isComplete = true;
    }

    if (secondaryCategory && !hasLevel3Children) {
      // Two levels (L1 & L2), and L2 has no further children
      isComplete = true;
    }

    if (tertiaryCategory && !hasLevel4Children) {
      // Three levels (L1, L2, L3), and L3 has no further children
      isComplete = true;
    }

    if (quaternaryCategory) {
      // Four levels and the last one is selected
      isComplete = true;
    }

    const leaf =
      quaternaryCategory ||
      tertiaryCategory ||
      secondaryCategory ||
      primaryCategory;

    if (leaf && isComplete) {
      // Store as an array to keep compatibility with existing `categories` handling
      setValue('categories', [
        {
          id: leaf.id,
          name: leaf.name,
        },
      ]);
    } else {
      // Don't clear pre-filled categories when editing: if form already has categories matching primary, keep them
      const currentCategories = (getValues('categories') ?? []) as any[];
      const primaryId = primaryCategory?.id != null ? Number(primaryCategory.id) : null;
      const preFilled =
        currentCategories.length === 1 &&
        primaryId != null &&
        Number(currentCategories[0]?.id) === primaryId;
      if (!preFilled) {
        setValue('categories', []);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    primaryCategory,
    secondaryCategory,
    tertiaryCategory,
    quaternaryCategory,
    rootCategories,
  ]);

  // Helper to get option label/value
  const getOptionLabel = (option: any) =>
    option?.slug ? `${option.name} (${option.slug})` : option.name;

  const getOptionValue = (option: any) => option.id;

  // Ensure each level only shows categories for its actual level/parent
  const all = (Array.isArray(rootCategories) ? rootCategories : []) as any[];
  const level1Options: Category[] = all.filter(
    (cat: any) => cat.level === 1,
  );
  const level2Options: Category[] =
    primaryCategory != null
      ? all.filter(
          (cat: any) => cat.parent_id === Number(primaryCategory.id),
        )
      : [];
  const level3Options: Category[] =
    secondaryCategory != null
      ? all.filter(
          (cat: any) => cat.parent_id === Number(secondaryCategory.id),
        )
      : [];
  const level4Options: Category[] =
    tertiaryCategory != null
      ? all.filter(
          (cat: any) => cat.parent_id === Number(tertiaryCategory.id),
        )
      : [];

  return (
    <div className="mb-5">
      <Label>{t('form:input-label-categories')}</Label>

      {!hasGroup ? (
        <p className="mt-1 text-sm text-body">
          {t('form:text-select-group-first')}
        </p>
      ) : (
        <>
          {/* Level 1 – categories under selected group */}
          <SelectInput
            name="primary_category"
            control={control}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            // @ts-ignore
            options={level1Options}
            isLoading={loadingRoot}
            placeholder={t('form:text-select-category')}
          />

          {/* Level 2 */}
          {primaryCategory && level2Options.length > 0 && (
            <div className="mt-3">
              <SelectInput
                name="secondary_category"
                control={control}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                // @ts-ignore
                options={level2Options}
                placeholder={t('form:text-select-sub-category')}
              />
            </div>
          )}

          {/* Level 3 */}
          {secondaryCategory && level3Options.length > 0 && (
            <div className="mt-3">
              <SelectInput
                name="tertiary_category"
                control={control}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                // @ts-ignore
                options={level3Options}
                placeholder={t('form:text-select-sub-category')}
              />
            </div>
          )}

          {/* Level 4 */}
          {tertiaryCategory && level4Options.length > 0 && (
            <div className="mt-3">
              <SelectInput
                name="quaternary_category"
                control={control}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                // @ts-ignore
                options={level4Options}
                placeholder={t('form:text-select-sub-category')}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductCategoryCascader;

