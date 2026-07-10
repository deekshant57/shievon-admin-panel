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
import { useRouter } from 'next/router';
import { useSettingsQuery } from '@/data/settings';
import { Routes } from '@/config/routes';

export default function AllShopPage() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { shops, paginatorInfo, loading, error } = useShopsQuery({
    name: searchTerm,
    limit: 10,
    page,
    orderBy,
    sortedBy,
  });
  const {
    paginatorInfo: inactivePaginatorInfo,
    loading: inactiveLoading,
    error: inactiveError,
  } = useInActiveShopsQuery({
    limit: 1,
    page: 1,
    is_active: false,
  });
  const { settings, loading: loadingSettings } = useSettingsQuery({
    language: locale!,
  });

  if (loading || loadingSettings || inactiveLoading) {
    return <Loader text={t('common:text-loading')} />;
  }
  if (error || inactiveError) {
    return <ErrorMessage message={error?.message || inactiveError?.message} />;
  }

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  return (
    <div className="space-y-6">
      <ShopsSummaryStrip
        totalShops={paginatorInfo?.total}
        inactiveShops={inactivePaginatorInfo?.total}
      />

      <DataPanel
        title={t('common:sidebar-nav-item-shops')}
        toolbar={
          <div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-name')}
              debounceMs={400}
            />
            <div className="flex flex-wrap items-center gap-3 md:ms-auto">
              <LinkActionButton href={Routes.newShops} variant="secondary">
                {t('common:text-inactive-shops')}
              </LinkActionButton>
              <LinkActionButton href={Routes.shop.create} variant="primary">
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
          isMultiCommissionRate={Boolean(
            settings?.options?.isMultiCommissionRate,
          )}
        />
      </DataPanel>
    </div>
  );
}
AllShopPage.authenticate = {
  permissions: adminOnly,
};
AllShopPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
