import CategoryList from '@/components/category/category-list';
import CategoriesSummaryStrip from '@/components/category/categories-summary-strip';
import TypeFilter from '@/components/category/type-filter';
import ServiceabilityFilter, {
  ServiceabilityFilterOption,
} from '@/components/filters/serviceability-filter';
import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import Search from '@/components/common/search';
import LinkActionButton from '@/components/ui/link-action-button';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { SortOrder, Type } from '@/types';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Routes } from '@/config/routes';
import { adminOnly } from '@/utils/auth-utils';
import { useCategoriesQuery } from '@/data/category';
import { useRouter } from 'next/router';
import { Config } from '@/config';

export default function Categories() {
  const { locale } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState('');
  const [isServiceable, setIsServiceable] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { categories, paginatorInfo, loading, error } = useCategoriesQuery({
    limit: 20,
    page,
    type,
    name: searchTerm,
    orderBy,
    sortedBy,
    parent: 'all',
    language: locale,
    is_serviceable: isServiceable,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <CategoriesSummaryStrip
        totalCategories={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('form:input-label-categories')}
        subtitle={t('common:categories-page-subtitle')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-name')}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 lg:flex-1"
            />
            <TypeFilter
              className="w-full shrink-0 lg:w-56"
              onTypeFilter={(selectedType: Type) => {
                setType(selectedType?.slug ?? '');
                setPage(1);
              }}
            />
            <ServiceabilityFilter
              className="w-full shrink-0 lg:w-52"
              onServiceabilityFilter={(
                option: ServiceabilityFilterOption | null,
              ) => {
                setIsServiceable(option?.value);
                setPage(1);
              }}
            />
            {locale === Config.defaultLanguage ? (
              <LinkActionButton
                href={Routes.category.create}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center lg:w-auto"
              >
                + {t('form:button-label-add-categories')}
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <CategoryList
          categories={categories}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}

Categories.authenticate = {
  permissions: adminOnly,
};
Categories.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['form', 'common', 'table'])),
  },
});
