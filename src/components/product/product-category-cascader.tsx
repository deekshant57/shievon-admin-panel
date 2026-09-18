import SelectInput from '@/components/ui/select-input';
import Label from '@/components/ui/label';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useCategoriesQuery } from '@/data/category';
import { useRouter } from 'next/router';
import { Category } from '@/types';

interface Props {
  control: Control<any>;
  setValue: any;
}

/**
 * Product category cascader — same UX on add and edit.
 *
 * Edit must show the full path pre-selected (e.g. Men → Casual Wear → Casual shirts),
 * never a leaf name in the top-level select whose options are only roots.
 */

const EMPTY_CATEGORIES: any[] = [];

function getParentId(item: any): number | null {
  const raw = item?.parentId ?? item?.parent_id ?? item?.parent ?? null;
  if (raw == null || raw === '' || raw === 0 || raw === '0') return null;
  const value =
    typeof raw === 'object' && raw !== null ? (raw as any).id : raw;
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function getLevel(item: any): number | null {
  const raw = item?.level ?? null;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

function getTypeId(item: any): number | null {
  const raw = item?.typeId ?? item?.type_id ?? null;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

/** Flatten nested category trees (children[]) into a list with parent_id set. */
function flattenCategories(
  nodes: any[],
  parentId: number | null = null,
  depth = 1,
): any[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];
  const out: any[] = [];
  for (const node of nodes) {
    if (!node || node.id == null) continue;
    const idNum = Number(node.id);
    const existingParent = getParentId(node);
    const resolvedParent =
      existingParent != null ? existingParent : parentId;
    const resolvedLevel = getLevel(node) ?? depth;
    out.push({
      ...node,
      parent_id: resolvedParent,
      level: resolvedLevel,
    });
    if (Array.isArray(node.children) && node.children.length > 0) {
      out.push(
        ...flattenCategories(node.children, idNum, depth + 1),
      );
    }
  }
  return out;
}

const pickCategory = (cat: any) => ({
  id: cat.id,
  name: cat.name,
  slug: cat.slug,
});

const optionId = (option: any) =>
  option?.id != null ? String(option.id) : '';

const ProductCategoryCascader = ({ control, setValue }: Props) => {
  const { locale } = useRouter();
  const { t } = useTranslation('common');
  const { getValues } = useFormContext();
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isPathHydrated, setIsPathHydrated] = useState(false);

  const type = useWatch({ control, name: 'type' });
  const savedCategories = useWatch({ control, name: 'categories' }) as
    | { id?: string | number; name?: string }[]
    | undefined;

  const typeId =
    type != null
      ? typeof type === 'object' && type.id != null
        ? Number(type.id)
        : Number(type)
      : undefined;
  const hasGroup = typeId != null && !Number.isNaN(typeId);

  const savedLeafId =
    savedCategories?.[0]?.id != null
      ? Number(savedCategories[0].id)
      : null;
  const savedLeafName = savedCategories?.[0]?.name?.trim() || null;
  const hasSavedLeaf =
    savedLeafId != null && !Number.isNaN(savedLeafId);

  const hierarchyResolved = useRef(false);
  const hierarchyResolvedAt = useRef(0);
  const lastResolvedLeafId = useRef<number | null>(null);

  const prevTypeId = useRef(typeId);
  useEffect(() => {
    const prev = prevTypeId.current;
    prevTypeId.current = typeId;
    const wasSet = prev != null && !Number.isNaN(Number(prev));
    const switchedGroup =
      wasSet && hasGroup && Number(prev) !== Number(typeId);

    if ((!hasGroup && wasSet) || switchedGroup) {
      setValue('categories', []);
      setValue('primary_category', null);
      setValue('secondary_category', null);
      setValue('tertiary_category', null);
      setValue('quaternary_category', null);
      hierarchyResolved.current = false;
      hierarchyResolvedAt.current = 0;
      lastResolvedLeafId.current = null;
      setResolveError(null);
      setIsPathHydrated(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  const { categories: rawCategories, loading: loadingRoot } = useCategoriesQuery(
    {
      limit: 999,
      type_id: typeId,
      parent: 'all',
      language: locale,
    },
    { enabled: hasGroup },
  );

  const stableRawCategories = rawCategories ?? EMPTY_CATEGORIES;

  const flatCategories = useMemo(() => {
    const flattened = flattenCategories(
      Array.isArray(stableRawCategories) ? (stableRawCategories as any[]) : [],
    );
    const byId = new Map<number, any>();
    for (const c of flattened) {
      const id = Number(c.id);
      if (Number.isNaN(id)) continue;
      if (!byId.has(id)) byId.set(id, c);
    }
    let list = Array.from(byId.values());
    if (hasGroup) {
      list = list.filter((c) => {
        const catTypeId = getTypeId(c);
        if (catTypeId == null) return true;
        return catTypeId === typeId;
      });
    }
    return list;
  }, [stableRawCategories, hasGroup, typeId]);

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

  // Resolve saved leaf → full cascade path once the tree is available.
  // Also re-runs when form reset clears primary but categories leaf remains.
  useEffect(() => {
    if (!hasGroup) return;
    if (!hasSavedLeaf) return;
    if (flatCategories.length === 0) return;

    const primaryEmpty = getValues('primary_category')?.id == null;
    const alreadyHydrated =
      !primaryEmpty &&
      hierarchyResolved.current &&
      lastResolvedLeafId.current === savedLeafId;
    if (alreadyHydrated) return;

    // Show loading while we rebuild the path (e.g. after form reset)
    setIsPathHydrated(false);

    const leaf = flatCategories.find(
      (c: any) => Number(c.id) === savedLeafId,
    );

    if (!leaf) {
      // eslint-disable-next-line no-console
      console.warn('[product-category-cascader] saved leaf not in tree', {
        savedLeafId,
        savedLeafName,
        treeSize: flatCategories.length,
        typeId,
      });
      setResolveError(
        savedLeafName
          ? `Could not rebuild path for “${savedLeafName}”. Please select categories again.`
          : 'Could not rebuild category path. Please select categories again.',
      );
      hierarchyResolved.current = true;
      lastResolvedLeafId.current = savedLeafId;
      setIsPathHydrated(true);
      return;
    }

    const path: any[] = [leaf];
    let current: any = leaf;
    const guard = new Set<number>([Number(leaf.id)]);
    while (getParentId(current) != null) {
      const parentId = getParentId(current)!;
      if (guard.has(parentId)) break;
      const parent = flatCategories.find(
        (c: any) => Number(c.id) === parentId,
      );
      if (!parent) break;
      path.unshift(parent);
      guard.add(parentId);
      current = parent;
    }

    hierarchyResolvedAt.current = Date.now();
    hierarchyResolved.current = true;
    lastResolvedLeafId.current = savedLeafId;
    setResolveError(null);
    setIsPathHydrated(true);

    setValue('primary_category', path[0] ? pickCategory(path[0]) : null);
    setValue('secondary_category', path[1] ? pickCategory(path[1]) : null);
    setValue('tertiary_category', path[2] ? pickCategory(path[2]) : null);
    setValue('quaternary_category', path[3] ? pickCategory(path[3]) : null);
    setValue('categories', [
      {
        id: leaf.id,
        name: leaf.name ?? savedLeafName ?? '',
      },
    ]);

    // eslint-disable-next-line no-console
    console.info('[product-category-cascader] resolved path', {
      leafId: savedLeafId,
      path: path.map((p) => ({ id: p.id, name: p.name, level: p.level })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    flatCategories,
    hasGroup,
    hasSavedLeaf,
    savedLeafId,
    primaryCategory?.id,
  ]);

  useEffect(() => {
    if (Date.now() - hierarchyResolvedAt.current < 1500) return;
    if (
      getValues('secondary_category') != null ||
      getValues('tertiary_category') != null ||
      getValues('quaternary_category') != null
    ) {
      setValue('secondary_category', null);
      setValue('tertiary_category', null);
      setValue('quaternary_category', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryCategory?.id]);

  useEffect(() => {
    if (Date.now() - hierarchyResolvedAt.current < 1500) return;
    if (
      getValues('tertiary_category') != null ||
      getValues('quaternary_category') != null
    ) {
      setValue('tertiary_category', null);
      setValue('quaternary_category', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondaryCategory?.id]);

  useEffect(() => {
    if (Date.now() - hierarchyResolvedAt.current < 1500) return;
    if (getValues('quaternary_category') != null) {
      setValue('quaternary_category', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tertiaryCategory?.id]);

  const flatRef = useRef(flatCategories);
  flatRef.current = flatCategories;

  const primaryId =
    primaryCategory?.id != null ? Number(primaryCategory.id) : null;
  const secondaryId =
    secondaryCategory?.id != null ? Number(secondaryCategory.id) : null;
  const tertiaryId =
    tertiaryCategory?.id != null ? Number(tertiaryCategory.id) : null;
  const quaternaryId =
    quaternaryCategory?.id != null ? Number(quaternaryCategory.id) : null;

  useEffect(() => {
    const list = flatRef.current;
    const hasLevel2Children =
      primaryId != null && list.some((c) => getParentId(c) === primaryId);
    const hasLevel3Children =
      secondaryId != null && list.some((c) => getParentId(c) === secondaryId);
    const hasLevel4Children =
      tertiaryId != null && list.some((c) => getParentId(c) === tertiaryId);

    let isComplete = false;
    if (primaryId != null && !hasLevel2Children) isComplete = true;
    if (secondaryId != null && !hasLevel3Children) isComplete = true;
    if (tertiaryId != null && !hasLevel4Children) isComplete = true;
    if (quaternaryId != null) isComplete = true;

    const leafId = quaternaryId ?? tertiaryId ?? secondaryId ?? primaryId;
    const leaf =
      quaternaryCategory ||
      tertiaryCategory ||
      secondaryCategory ||
      primaryCategory;

    if (leaf && leafId != null && isComplete) {
      const current = (getValues('categories') ?? []) as any[];
      const same = current.length === 1 && Number(current[0]?.id) === leafId;
      if (!same) {
        setValue('categories', [{ id: leaf.id, name: leaf.name }]);
      }
    } else {
      if (Date.now() - hierarchyResolvedAt.current < 1500) return;
      const currentCategories = (getValues('categories') ?? []) as any[];
      if (currentCategories.length === 0) return;
      const savedId = Number(currentCategories[0]?.id);
      const preFilled =
        !Number.isNaN(savedId) &&
        (savedId === primaryId ||
          savedId === secondaryId ||
          savedId === tertiaryId ||
          savedId === quaternaryId);
      if (!preFilled && !hasSavedLeaf) {
        setValue('categories', []);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryId, secondaryId, tertiaryId, quaternaryId]);

  const getOptionLabel = (option: any) =>
    option?.slug ? `${option.name} (${option.slug})` : option?.name;

  const level1Options = flatCategories.filter((c) => {
    const parentId = getParentId(c);
    const lvl = getLevel(c);
    return lvl === 1 || parentId == null;
  });
  const level2Options =
    primaryId != null
      ? flatCategories.filter((c) => getParentId(c) === primaryId)
      : [];
  const level3Options =
    secondaryId != null
      ? flatCategories.filter((c) => getParentId(c) === secondaryId)
      : [];
  const level4Options =
    tertiaryId != null
      ? flatCategories.filter((c) => getParentId(c) === tertiaryId)
      : [];

  // Don't paint cascade selects until edit hydration is done (avoids leaf-in-L1 mismatch)
  const isHydratingEdit =
    hasGroup && hasSavedLeaf && !isPathHydrated && !resolveError;
  const showCascade =
    hasGroup && (!hasSavedLeaf || isPathHydrated || Boolean(resolveError));

  return (
    <div className="mb-5">
      <Label>{t('form:input-label-categories')}</Label>

      {!hasGroup ? (
        <p className="mt-1 text-sm text-body">
          {t('form:text-select-group-first')}
        </p>
      ) : (
        <>
          {isHydratingEdit ? (
            <p className="mb-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-body">
              {t('form:text-loading-saved-category') || 'Loading saved category'}
              {savedLeafName ? (
                <>
                  {': '}
                  <span className="font-medium text-heading">
                    {savedLeafName}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}

          {resolveError ? (
            <p className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {resolveError}
            </p>
          ) : null}

          {showCascade ? (
            <>
              <SelectInput
                name="primary_category"
                control={control}
                getOptionLabel={getOptionLabel}
                getOptionValue={optionId}
                // @ts-ignore
                options={level1Options}
                isLoading={loadingRoot}
                placeholder={t('form:text-select-category')}
              />

              {primaryCategory && level2Options.length > 0 && (
                <div className="mt-3">
                  <SelectInput
                    name="secondary_category"
                    control={control}
                    getOptionLabel={getOptionLabel}
                    getOptionValue={optionId}
                    // @ts-ignore
                    options={level2Options}
                    placeholder={t('form:text-select-sub-category')}
                  />
                </div>
              )}

              {secondaryCategory && level3Options.length > 0 && (
                <div className="mt-3">
                  <SelectInput
                    name="tertiary_category"
                    control={control}
                    getOptionLabel={getOptionLabel}
                    getOptionValue={optionId}
                    // @ts-ignore
                    options={level3Options}
                    placeholder={t('form:text-select-sub-category')}
                  />
                </div>
              )}

              {tertiaryCategory && level4Options.length > 0 && (
                <div className="mt-3">
                  <SelectInput
                    name="quaternary_category"
                    control={control}
                    getOptionLabel={getOptionLabel}
                    getOptionValue={optionId}
                    // @ts-ignore
                    options={level4Options}
                    placeholder={t('form:text-select-sub-category')}
                  />
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
};

export default ProductCategoryCascader;
