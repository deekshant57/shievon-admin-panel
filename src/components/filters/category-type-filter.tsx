import Select from '@/components/ui/select/select';
import { useAuthorsQuery } from '@/data/author';
import { useCategoriesQuery } from '@/data/category';
import { useTypesQuery } from '@/data/type';
import { ProductType } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { ActionMeta } from 'react-select';

type Props = {
  onCategoryFilter?: (newValue: any, actionMeta: ActionMeta<unknown>) => void;
  onTypeFilter?: (newValue: any, actionMeta: ActionMeta<unknown>) => void;
  onAuthorFilter?: (newValue: any, actionMeta: ActionMeta<unknown>) => void;
  onProductTypeFilter?: (
    newValue: any,
    actionMeta: ActionMeta<unknown>,
  ) => void;
  className?: string;
  type?: string;
  enableType?: boolean;
  enableCategory?: boolean;
  enableAuthor?: boolean;
  enableProductType?: boolean;
  typeNameAllowList?: string[];
  typeNameDenyList?: string[];
  /** Use hybrid design-system select styling (default: true). */
  variant?: 'default' | 'hybrid';
};

type FilterFieldProps = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
};

const FilterField = ({ label, htmlFor, children }: FilterFieldProps) => (
  <div className="flex w-full flex-col gap-2">
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {label}
    </label>
    {children}
  </div>
);

export default function CategoryTypeFilter({
  onTypeFilter,
  onCategoryFilter,
  onAuthorFilter,
  onProductTypeFilter,
  className,
  type,
  enableType,
  enableCategory,
  enableAuthor,
  enableProductType,
  typeNameAllowList,
  typeNameDenyList,
  variant = 'hybrid',
}: Props) {
  const { locale } = useRouter();
  const { t } = useTranslation('common');

  const { types: rawTypes, loading } = useTypesQuery({ language: locale });
  const normalizedAllow = (typeNameAllowList ?? []).map((v) =>
    String(v).trim().toLowerCase(),
  );
  const normalizedDeny = (typeNameDenyList ?? []).map((v) =>
    String(v).trim().toLowerCase(),
  );
  const types = (rawTypes ?? []).filter((item: any) => {
    const name = String(item?.name ?? '').trim().toLowerCase();
    if (normalizedAllow.length) return normalizedAllow.includes(name);
    if (normalizedDeny.length) return !normalizedDeny.includes(name);
    return true;
  });
  const { categories, loading: categoryLoading } = useCategoriesQuery({
    limit: 999,
    language: locale,
    type,
  });

  const { authors, loading: authorLoading } = useAuthorsQuery({
    limit: 999,
    language: locale,
  });

  const productTypeOptions = useMemo(
    () => [
      { name: t('text-single-product'), slug: ProductType.Single },
      { name: t('text-variable-product'), slug: ProductType.Variable },
    ],
    [t],
  );

  const selectVariant = variant === 'hybrid' ? 'hybrid' : 'default';

  return (
    <div
      className={cn(
        'grid w-full grid-cols-1 gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-5',
        className,
      )}
    >
      {enableType ? (
        <FilterField label={t('filter-by-type')} htmlFor="filter-type">
          <Select
            inputId="filter-type"
            variant={selectVariant}
            options={types}
            isLoading={loading}
            getOptionLabel={(option: any) => option.name}
            getOptionValue={(option: any) => option.slug}
            placeholder={t('filter-by-type-placeholder')}
            onChange={onTypeFilter}
            isClearable
          />
        </FilterField>
      ) : null}

      {enableCategory ? (
        <FilterField label={t('filter-by-category')} htmlFor="filter-category">
          <Select
            inputId="filter-category"
            variant={selectVariant}
            options={categories}
            getOptionLabel={(option: any) => option.name}
            getOptionValue={(option: any) => option.slug}
            placeholder={t('filter-by-category-placeholder')}
            isLoading={categoryLoading}
            onChange={onCategoryFilter}
            isClearable
          />
        </FilterField>
      ) : null}

      {enableAuthor ? (
        <FilterField label={t('filter-by-author')} htmlFor="filter-author">
          <Select
            inputId="filter-author"
            variant={selectVariant}
            options={authors}
            getOptionLabel={(option: any) => option.name}
            getOptionValue={(option: any) => option.slug}
            placeholder={t('filter-by-author-placeholder')}
            isLoading={authorLoading}
            onChange={onAuthorFilter}
            isClearable
          />
        </FilterField>
      ) : null}

      {enableProductType ? (
        <FilterField
          label={t('filter-by-product-type')}
          htmlFor="filter-product-type"
        >
          <Select
            inputId="filter-product-type"
            variant={selectVariant}
            options={productTypeOptions}
            getOptionLabel={(option: any) => option.name}
            getOptionValue={(option: any) => option.slug}
            placeholder={t('filter-by-product-type-placeholder')}
            onChange={onProductTypeFilter}
            isClearable
          />
        </FilterField>
      ) : null}
    </div>
  );
}
