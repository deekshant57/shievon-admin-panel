import Label from '@/components/ui/label';
import Select from '@/components/ui/select/select';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useCategoriesQuery } from '@/data/category';
import { useRouter } from 'next/router';

interface Props {
  control: Control<any>;
  setValue: any;
}

const EMPTY_CATEGORIES: any[] = [];

function parseCategoryPath(path: unknown): number[] {
  if (typeof path !== 'string' || path.trim() === '') return [];
  return path
    .split('/')
    .map((part) => Number(part))
    .filter((n) => !Number.isNaN(n) && n !== 0);
}

function getParentId(item: any): number | null {
  // API marks L1 roots with level=1 and parent_id=null. Trust that first so
  // empty `parent: {}` objects or path noise cannot promote a root to a child.
  if (Number(item?.level) === 1) return null;

  const pathIds = parseCategoryPath(item?.path);
  const inferredParent =
    pathIds.length >= 2 ? pathIds[pathIds.length - 2] : null;
  const candidates = [
    item?.parent_id,
    item?.parentId,
    inferredParent,
    typeof item?.parent === 'object' && item?.parent !== null
      ? item.parent.id
      : item?.parent,
  ];
  for (const raw of candidates) {
    if (raw == null || raw === '' || raw === 0 || raw === '0') continue;
    const value =
      typeof raw === 'object' && raw !== null ? (raw as any).id : raw;
    const n = Number(value);
    if (!Number.isNaN(n) && n !== 0) return n;
  }
  return null;
}

function getLevel(item: any): number | null {
  const raw = item?.level ?? null;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

function getTypeId(item: any): number | null {
  const raw =
    item?.typeId ??
    item?.type_id ??
    (typeof item?.type === 'object' ? item?.type?.id : item?.type) ??
    null;
  if (raw == null || raw === '') return null;
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
      out.push(...flattenCategories(node.children, idNum, depth + 1));
    }
  }
  return out;
}

const pickCategory = (cat: any) => ({
  id: cat.id,
  name: cat.name,
  slug: cat.slug,
});

function buildCategoryPath(leaf: any, flatCategories: any[]): any[] {
  const pathFromField = parseCategoryPath(leaf?.path)
    .map((id) => flatCategories.find((category) => Number(category.id) === id))
    .filter(Boolean);

  if (pathFromField.length > 0) return pathFromField;

  const path = [leaf];
  let current = leaf;
  const guard = new Set<number>([Number(leaf.id)]);
  while (getParentId(current) != null) {
    const parentId = getParentId(current)!;
    if (guard.has(parentId)) break;
    const parent = flatCategories.find(
      (category) => Number(category.id) === parentId,
    );
    if (!parent) break;
    path.unshift(parent);
    guard.add(parentId);
    current = parent;
  }
  return path;
}

function isLeafCategory(category: any, flatCategories: any[]): boolean {
  const id = Number(category?.id);
  if (Number.isNaN(id)) return false;
  return !flatCategories.some((item) => getParentId(item) === id);
}

const optionId = (option: any) =>
  option?.id != null ? String(option.id) : '';

const pickSavedLeaf = (
  saved?: { id?: string | number; name?: string; level?: number }[],
) => {
  if (!Array.isArray(saved) || saved.length === 0) return null;
  const withLevel = saved.filter((item) => item?.level != null);
  if (withLevel.length > 0) {
    return [...withLevel].sort(
      (a, b) => Number(b.level) - Number(a.level),
    )[0];
  }
  return saved[saved.length - 1];
};

const ProductCategoryCascader = ({ control, setValue }: Props) => {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const { getValues } = useFormContext();
  const [resolveError, setResolveError] = useState<string | null>(null);

  const type = useWatch({ control, name: 'type' });
  const savedCategories = useWatch({ control, name: 'categories' }) as
    | { id?: string | number; name?: string; level?: number }[]
    | undefined;

  const typeId =
    type != null
      ? typeof type === 'object' && type.id != null
        ? Number(type.id)
        : Number(type)
      : undefined;
  const typeSlug =
    type != null && typeof type === 'object' ? type.slug : undefined;
  const hasGroup = typeId != null && !Number.isNaN(typeId);

  const savedLeaf = pickSavedLeaf(savedCategories);
  const savedLeafId =
    savedLeaf?.id != null ? Number(savedLeaf.id) : null;
  const savedLeafName = savedLeaf?.name?.trim() || null;
  const hasSavedLeaf =
    savedLeafId != null && !Number.isNaN(savedLeafId);

  const hierarchyResolved = useRef(false);
  const lastResolvedLeafId = useRef<number | null>(null);

  const prevTypeId = useRef<number | undefined>(undefined);
  useEffect(() => {
    const prev = prevTypeId.current;
    prevTypeId.current = typeId;
    if (prev == null || Number.isNaN(Number(prev))) return;
    if (typeId == null || Number.isNaN(Number(typeId))) return;
    if (Number(prev) === Number(typeId)) return;

    setValue('categories', []);
    setValue('primary_category', null);
    setValue('secondary_category', null);
    setValue('tertiary_category', null);
    setValue('quaternary_category', null);
    hierarchyResolved.current = false;
    lastResolvedLeafId.current = null;
    setResolveError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  const { categories: rawCategories, loading: loadingRoot } = useCategoriesQuery(
    {
      limit: 999,
      // Prefer group slug — type_id alone is not reliably filtered by the API
      // and otherwise returns every group's tree (Men from clothing/footwear/eyewear).
      ...(typeSlug ? { type: typeSlug } : {}),
      ...(hasGroup ? { type_id: typeId } : {}),
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
      const existing = byId.get(id);
      if (!existing) {
        byId.set(id, c);
        continue;
      }
      // Prefer the copy that actually knows its parent (flat `parent=all` lists
      // can also include a nested duplicate without parent_id).
      if (getParentId(existing) == null && getParentId(c) != null) {
        byId.set(id, c);
      }
    }
    let list = Array.from(byId.values());
    if (hasGroup) {
      list = list.filter((c) => {
        const catTypeId = getTypeId(c);
        const catTypeSlug =
          typeof c?.type === 'object' ? c?.type?.slug : c?.type;
        if (typeSlug && catTypeSlug) return catTypeSlug === typeSlug;
        if (catTypeId == null) return !typeSlug;
        return catTypeId === typeId;
      });
    }
    return list;
  }, [stableRawCategories, hasGroup, typeId, typeSlug]);

  // Rebuild L1→leaf from the saved product category once the tree is available.
  useEffect(() => {
    if (!hasGroup || !hasSavedLeaf || flatCategories.length === 0) return;
    if (
      hierarchyResolved.current &&
      lastResolvedLeafId.current === savedLeafId &&
      getValues('primary_category')?.id != null
    ) {
      return;
    }

    const leaf = flatCategories.find(
      (c: any) => Number(c.id) === savedLeafId,
    );

    if (!leaf) {
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
      return;
    }

    const path = buildCategoryPath(leaf, flatCategories);

    hierarchyResolved.current = true;
    lastResolvedLeafId.current = savedLeafId;
    setResolveError(null);

    setValue('primary_category', path[0] ? pickCategory(path[0]) : null, {
      shouldDirty: false,
    });
    setValue('secondary_category', path[1] ? pickCategory(path[1]) : null, {
      shouldDirty: false,
    });
    setValue('tertiary_category', path[2] ? pickCategory(path[2]) : null, {
      shouldDirty: false,
    });
    setValue('quaternary_category', path[3] ? pickCategory(path[3]) : null, {
      shouldDirty: false,
    });
    setValue(
      'categories',
      [
        {
          id: leaf.id,
          name: leaf.name ?? savedLeafName ?? '',
        },
      ],
      { shouldDirty: false },
    );

    console.info('[product-category-cascader] resolved path', {
      leafId: savedLeafId,
      path: path.map((p) => ({ id: p.id, name: p.name, level: p.level })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatCategories, hasGroup, hasSavedLeaf, savedLeafId]);

  const groupedLeafOptions = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const category of flatCategories) {
      if (!isLeafCategory(category, flatCategories)) continue;
      const path = buildCategoryPath(category, flatCategories);
      const groupLabel =
        path.length > 1
          ? path
              .slice(0, -1)
              .map((item) => item.name)
              .join(' / ')
          : category.name;
      const option = pickCategory(category);
      const existing = groups.get(groupLabel) ?? [];
      existing.push(option);
      groups.set(groupLabel, existing);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, options]) => ({
        label,
        options: options.sort((a, b) =>
          String(a.name).localeCompare(String(b.name)),
        ),
      }));
  }, [flatCategories]);

  const selectedLeafOption = useMemo(() => {
    if (!hasSavedLeaf) return null;
    for (const group of groupedLeafOptions) {
      const match = group.options.find(
        (option) => Number(option.id) === savedLeafId,
      );
      if (match) return match;
    }
    const leaf = flatCategories.find(
      (category) => Number(category.id) === savedLeafId,
    );
    return leaf ? pickCategory(leaf) : null;
  }, [flatCategories, groupedLeafOptions, hasSavedLeaf, savedLeafId]);

  const selectedPath = useMemo(() => {
    if (!selectedLeafOption) return [];
    const leaf = flatCategories.find(
      (category) => Number(category.id) === Number(selectedLeafOption.id),
    );
    if (!leaf) return [selectedLeafOption];
    return buildCategoryPath(leaf, flatCategories);
  }, [flatCategories, selectedLeafOption]);

  const applyLeaf = (next: any) => {
    if (next == null || next.id == null) {
      setValue('categories', [], { shouldDirty: true });
      setValue('primary_category', null, { shouldDirty: true });
      setValue('secondary_category', null, { shouldDirty: true });
      setValue('tertiary_category', null, { shouldDirty: true });
      setValue('quaternary_category', null, { shouldDirty: true });
      hierarchyResolved.current = false;
      lastResolvedLeafId.current = null;
      return;
    }

    const leaf =
      flatCategories.find((category) => Number(category.id) === Number(next.id)) ??
      next;
    const path = buildCategoryPath(leaf, flatCategories);
    hierarchyResolved.current = true;
    lastResolvedLeafId.current = Number(leaf.id);
    setResolveError(null);
    setValue('primary_category', path[0] ? pickCategory(path[0]) : null, {
      shouldDirty: true,
    });
    setValue('secondary_category', path[1] ? pickCategory(path[1]) : null, {
      shouldDirty: true,
    });
    setValue('tertiary_category', path[2] ? pickCategory(path[2]) : null, {
      shouldDirty: true,
    });
    setValue('quaternary_category', path[3] ? pickCategory(path[3]) : null, {
      shouldDirty: true,
    });
    setValue(
      'categories',
      [{ id: leaf.id, name: leaf.name ?? '' }],
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const getOptionLabel = (option: any) =>
    option?.slug ? `${option.name} (${option.slug})` : option?.name;

  return (
    <div className="mb-5">
      <Label>{t('form:input-label-categories')}</Label>

      {!hasGroup ? (
        <p className="mt-1 text-sm text-body">
          {t('form:text-select-group-first')}
        </p>
      ) : (
        <>
          {resolveError ? (
            <p className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {resolveError}
            </p>
          ) : null}

          {selectedPath.length > 0 ? (
            <p className="mb-2 text-sm text-heading">
              {selectedPath.map((item) => item.name).join(' / ')}
            </p>
          ) : null}

          <Select
            value={selectedLeafOption}
            options={groupedLeafOptions}
            getOptionLabel={getOptionLabel}
            getOptionValue={optionId}
            isLoading={loadingRoot}
            isClearable
            placeholder={t('form:text-select-category') || 'Search categories'}
            onChange={applyLeaf}
          />
        </>
      )}
    </div>
  );
};

export default ProductCategoryCascader;
