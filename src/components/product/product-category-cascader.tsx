import SelectInput from '@/components/ui/select-input';
import Label from '@/components/ui/label';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useRef } from 'react';
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

// Stable empty array so useMemo/useEffect deps don't change when the query has no data yet (data?.data ?? [] is new every render).
const EMPTY_CATEGORIES: any[] = [];

const ProductCategoryCascader = ({ control, setValue }: Props) => {
  const { locale } = useRouter();
  const { t } = useTranslation('common');
  const { getValues } = useFormContext();

  // Watch selected product type (group) – may be full object { id, name, slug } or just id
  const type = useWatch({
    control,
    name: 'type',
  });

  // Resolve type id for API and filtering (form can store type as object or id)
  const typeId =
    type != null
      ? typeof type === 'object' && type.id != null
        ? Number(type.id)
        : Number(type)
      : undefined;
  const hasGroup = typeId != null && !Number.isNaN(typeId);

  // When type (group) changes or is cleared, reset all category-related fields. Only depend on typeId (not dirtyFields) to avoid loop.
  useEffect(() => {
    if (!hasGroup) {
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

  // Use stable empty array when query has no data so we don't get a new reference every render (useCategoriesQuery returns data?.data ?? []).
  const stableRawCategories = rawCategories ?? EMPTY_CATEGORIES;
  // Filter by type_id client-side so only categories for the selected group are shown (in case backend returns all).
  // Memoize so the reference is stable and does not trigger useEffect on every render.
  const rootCategories = useMemo(
    () =>
      hasGroup && Array.isArray(stableRawCategories)
        ? (stableRawCategories as any[]).filter(
            (c: any) => c.type_id != null && Number(c.type_id) === typeId,
          )
        : stableRawCategories,
    [hasGroup, stableRawCategories, typeId],
  );

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

  // Clear deeper levels when an upper level changes. Only set when needed to avoid extra re-renders.
  useEffect(() => {
    if (getValues('secondary_category') != null || getValues('tertiary_category') != null || getValues('quaternary_category') != null) {
      setValue('secondary_category', null);
      setValue('tertiary_category', null);
      setValue('quaternary_category', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryCategory?.id]);

  useEffect(() => {
    if (getValues('tertiary_category') != null || getValues('quaternary_category') != null) {
      setValue('tertiary_category', null);
      setValue('quaternary_category', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondaryCategory?.id]);

  useEffect(() => {
    if (getValues('quaternary_category') != null) {
      setValue('quaternary_category', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tertiaryCategory?.id]);

  // Keep latest rootCategories in a ref so we can read it in the effect without listing it in deps (avoids loop from unstable array refs).
  const rootCategoriesRef = useRef(rootCategories);
  rootCategoriesRef.current = rootCategories;

  // Whenever any level changes, update the `categories` field only when the selection is "complete".
  // Depend only on primitive ids so the effect never re-runs from array/object reference changes.
  const primaryId = primaryCategory?.id != null ? Number(primaryCategory.id) : null;
  const secondaryId = secondaryCategory?.id != null ? Number(secondaryCategory.id) : null;
  const tertiaryId = tertiaryCategory?.id != null ? Number(tertiaryCategory.id) : null;
  const quaternaryId = quaternaryCategory?.id != null ? Number(quaternaryCategory.id) : null;

  useEffect(() => {
    const allCategories = Array.isArray(rootCategoriesRef.current) ? rootCategoriesRef.current : [];
    // Determine if there are further children for the current selections
    const hasLevel2Children =
      primaryId != null &&
      (allCategories as any[]).some((c: any) => c.parent_id === primaryId);
    const hasLevel3Children =
      secondaryId != null &&
      (allCategories as any[]).some((c: any) => c.parent_id === secondaryId);
    const hasLevel4Children =
      tertiaryId != null &&
      (allCategories as any[]).some((c: any) => c.parent_id === tertiaryId);

    // Selection is considered complete only when there is no unselected deeper level
    let isComplete = false;

    if (primaryId != null && !hasLevel2Children) {
      isComplete = true;
    }

    if (secondaryId != null && !hasLevel3Children) {
      isComplete = true;
    }

    if (tertiaryId != null && !hasLevel4Children) {
      isComplete = true;
    }

    if (quaternaryId != null) {
      isComplete = true;
    }

    const leafId = quaternaryId ?? tertiaryId ?? secondaryId ?? primaryId;
    const leaf =
      quaternaryCategory ||
      tertiaryCategory ||
      secondaryCategory ||
      primaryCategory;

    if (leaf && leafId != null && isComplete) {
      const nextCategories = [{ id: leaf.id, name: leaf.name }];
      const current = (getValues('categories') ?? []) as any[];
      const same = current.length === 1 && Number(current[0]?.id) === leafId;
      if (!same) {
        setValue('categories', nextCategories);
      }
    } else {
      // Don't clear pre-filled categories when editing: if form already has categories matching primary, keep them
      const currentCategories = (getValues('categories') ?? []) as any[];
      const preFilled =
        currentCategories.length === 1 &&
        primaryId != null &&
        Number(currentCategories[0]?.id) === primaryId;
      if (!preFilled && currentCategories.length > 0) {
        setValue('categories', []);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryId, secondaryId, tertiaryId, quaternaryId]);

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

