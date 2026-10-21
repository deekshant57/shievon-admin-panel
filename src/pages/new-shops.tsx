import DataPanel from '@/components/page/data-panel';
import Layout from '@/components/layouts/admin';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import LinkActionButton from '@/components/ui/link-action-button';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ShopList from '@/components/shop/shop-list';
import ShopsSummaryStrip from '@/components/shop/shops-summary-strip';
import { useState } from 'react';
import Search from '@/components/common/search';
import { adminOnly } from '@/utils/auth-utils';
import { useInActiveShopsQuery, useShopsQuery } from '@/data/shop';
import { SortOrder } from '@/types';
import { Routes } from '@/config/routes';

export default function NewShopPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { shops, paginatorInfo, loading, error } = useInActiveShopsQuery({
    name: searchTerm,
    limit: 10,
    page,
    orderBy,
    sortedBy,
    is_active: false,
  });
  const {
    shopCounts,
    loading: allShopsLoading,
    error: allShopsError,
  } = useShopsQuery({
    limit: 1,
    page: 1,
  });

  if (loading || allShopsLoading) {
    return <Loader text={t('common:text-loading')} />;
  }
  if (error || allShopsError) {
    return <ErrorMessage message={error?.message || allShopsError?.message} />;
  }

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <ShopsSummaryStrip
        totalShops={shopCounts?.total}
        activeShops={shopCounts?.active}
        inactiveShops={shopCounts?.inactive}
      />

      <DataPanel
        className="mb-0"
        title={t('common:text-inactive-shops')}
        subtitle={t('common:inactive-shops-page-subtitle')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-name')}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <LinkActionButton
                href={Routes.shop.list}
                variant="secondary"
                size="sm"
                className="w-full justify-center sm:w-auto"
              >
                {t('common:text-all-shops')}
              </LinkActionButton>
              <LinkActionButton
                href={Routes.shop.create}
                variant="primary"
                size="sm"
                className="w-full justify-center sm:w-auto"
              >
                + {t('common:text-add-all-shops')}
              </LinkActionButton>
            </div>
          </div>
        }
      >
        <ShopList
          shops={shops}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}
NewShopPage.authenticate = {
  permissions: adminOnly,
};
NewShopPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
