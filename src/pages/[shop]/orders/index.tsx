import Search from '@/components/common/search';
import OrderList from '@/components/order/order-list';
import DataPanel from '@/components/page/data-panel';
import ActionButton from '@/components/ui/action-button';
import { LIMIT } from '@/utils/constants';
import { useState, useEffect, useRef } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ShopLayout from '@/components/layouts/shop';
import { useRouter } from 'next/router';
import {
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useOrdersQuery } from '@/data/order';
import { SortOrder } from '@/types';
import { useShopQuery } from '@/data/shop';
import { DownloadIcon } from '@/components/icons/download-icon';
import { useExportOrderQuery } from '@/data/export';
import { useMeQuery } from '@/data/user';
import { Routes } from '@/config/routes';

export default function Orders() {
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const { locale } = useRouter();
  const {
    query: { shop },
  } = router;
  const { t } = useTranslation();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { data: shopData, isLoading: fetchingShop } = useShopQuery({
    slug: shop as string,
  });
  const shopId = shopData?.id!;
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const hasRedirectedRef = useRef(false);
  const { orders, loading, paginatorInfo, error } = useOrdersQuery(
    {
      language: locale,
      limit: LIMIT,
      page,
      tracking_number: searchTerm,
      orderBy,
      sortedBy,
      shop_id: shopId,
    },
    {
      enabled: Boolean(shopId),
    },
  );

  const { refetch } = useExportOrderQuery(
    {
      ...(shopId && { shop_id: shopId }),
    },
    { enabled: false },
  );

  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }

    if (fetchingShop || !shopId || !me) {
      return;
    }

    const hasRequiredPermission = hasAccess(
      adminOwnerAndStaffOnly,
      permissions,
    );
    const ownsShop =
      me?.shops?.some((s) => String(s.id) === String(shopId)) ?? false;
    const isManagedShop =
      me?.managed_shop?.id != null &&
      String(me.managed_shop.id) === String(shopId);

    if (!hasRequiredPermission && !ownsShop && !isManagedShop) {
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [fetchingShop, shopId, me, permissions, router]);

  if (loading || fetchingShop)
    return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error?.message} />;

  async function handleExportOrder() {
    const { data } = await refetch();

    if (data) {
      const a = document.createElement('a');
      a.href = data;
      a.setAttribute('download', 'export-order');
      a.click();
    }
  }

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <DataPanel
        className="mb-0"
        title={t('form:input-label-orders')}
        subtitle={t('common:orders-page-subtitle')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t(
                'form:input-placeholder-search-tracking-number',
              )}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            <ActionButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleExportOrder}
              className="w-full shrink-0 justify-center sm:w-auto"
            >
              <DownloadIcon className="me-2 h-4 w-4 shrink-0" />
              {t('common:text-export-orders')}
            </ActionButton>
          </div>
        }
      >
        <OrderList
          orders={orders}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}
Orders.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
Orders.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
