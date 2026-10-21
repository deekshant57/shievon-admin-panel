import Layout from '@/components/layouts/admin';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ProductList from '@/components/product/product-list';
import { useState } from 'react';
import Search from '@/components/common/search';
import { adminOnly } from '@/utils/auth-utils';
import { SortOrder } from '@/types';
import { useProductStockQuery } from '@/data/product';
import { useRouter } from 'next/router';
import CategoryTypeFilter from '@/components/filters/category-type-filter';
import { ArrowDown } from '@/components/icons/arrow-down';
import { ArrowUp } from '@/components/icons/arrow-up';
import DataPanel from '@/components/page/data-panel';
import ProductsSummaryStrip from '@/components/product/products-summary-strip';
import ActionButton from '@/components/ui/action-button';

export default function ProductStockPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const { locale } = useRouter();
  const [visible, setVisible] = useState(false);

  const toggleVisible = () => {
    setVisible((v) => !v);
  };

  const { products, paginatorInfo, loading, error } = useProductStockQuery({
    language: locale,
    name: searchTerm,
    limit: 10,
    page,
    orderBy,
    sortedBy,
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
      <ProductsSummaryStrip matchingResults={paginatorInfo?.total} />

      <DataPanel
        className="mb-0"
        title={t('form:input-label-products')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3">
            <Search
              onSearch={handleSearch}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full"
            />

            <div className="flex flex-wrap items-center justify-end gap-3">
              <ActionButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={toggleVisible}
                className="w-full justify-center sm:w-auto"
              >
                {t('common:text-filter')}
                {visible ? (
                  <ArrowUp className="ms-1 h-3.5 w-3.5" />
                ) : (
                  <ArrowDown className="ms-1 h-3.5 w-3.5" />
                )}
              </ActionButton>
            </div>
          </div>
        }
        filters={
          visible ? (
            <CategoryTypeFilter
              className="w-full"
              onCategoryFilter={({ slug }: { slug: string }) => {
                setPage(1);
                setCategory(slug);
              }}
              onTypeFilter={({ slug }: { slug: string }) => {
                setType(slug);
                setPage(1);
              }}
              enableCategory
              enableType
            />
          ) : undefined
        }
      >
        <ProductList
          products={products}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}
ProductStockPage.authenticate = {
  permissions: adminOnly,
};
ProductStockPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
