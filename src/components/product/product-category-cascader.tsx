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

  // Watch selected product type (same as previous ProductCategoryInput)
  const type = useWatch({
    control,
    name: 'type',
  });

  const { dirtyFields } = useFormState({
    control,
  });

  // When type changes, reset all category-related fields
  useEffect(() => {
    if (type?.slug && dirtyFields?.type) {
      setValue('categories', []);
      setValue('primary_category', null);
      setValue('secondary_category', null);
      setValue('tertiary_category', null);
      setValue('quaternary_category', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type?.slug]);

  // Load root categories for the selected type
  const { categories: rootCategories, loading: loadingRoot } = useCategoriesQuery({
    limit: 999,
    type: type?.slug,
    parent: null,
    language: locale,
  });

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

  // Debug: log current selections on each render
  // Helps understand why selections might disappear in the cascading dropdowns
  console.log('[CategoryCascader] selections', {
    typeSlug: type?.slug,
    primaryCategoryId: primaryCategory?.id,
    secondaryCategoryId: secondaryCategory?.id,
    tertiaryCategoryId: tertiaryCategory?.id,
    quaternaryCategoryId: quaternaryCategory?.id,
  });

  // Clear deeper levels when an upper level changes
  useEffect(() => {
    // When primary changes, clear all deeper levels
    setValue('secondary_category', null);
    setValue('tertiary_category', null);
    setValue('quaternary_category', null);
    console.log('[CategoryCascader] reset below primary', {
      primaryCategoryId: primaryCategory?.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryCategory?.id]);

  useEffect(() => {
    // When secondary changes, clear tertiary & quaternary
    setValue('tertiary_category', null);
    setValue('quaternary_category', null);
    console.log('[CategoryCascader] reset below secondary', {
      secondaryCategoryId: secondaryCategory?.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondaryCategory?.id]);

  useEffect(() => {
    // When tertiary changes, clear quaternary
    setValue('quaternary_category', null);
    console.log('[CategoryCascader] reset below tertiary', {
      tertiaryCategoryId: tertiaryCategory?.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tertiaryCategory?.id]);

  // Whenever any level changes, update the `categories` field only when the selection is "complete"
  useEffect(() => {
    const allCategories = rootCategories ?? [];
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

    console.log('[CategoryCascader] completion check', {
      hasLevel2Children,
      hasLevel3Children,
      hasLevel4Children,
      isComplete,
      leafId: leaf?.id,
    });

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

  // Ensure each level only shows categories for its actual level/parent,
  // even if the backend returns a flat list or ignores the parent filter.
  const all = (rootCategories ?? []) as any[];
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

  // Debug: log options available at each level when selections change
  console.log('[CategoryCascader] options', {
    total: all.length,
    level1Count: level1Options.length,
    level2Count: level2Options.length,
    level3Count: level3Options.length,
    level4Count: level4Options.length,
  });

  return (
    <div className="mb-5">
      <Label>{t('form:input-label-categories')}</Label>

      {/* Level 1 */}
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
    </div>
  );
};

export default ProductCategoryCascader;

