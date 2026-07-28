import ShopLayout from '@/components/layouts/shop';
import { DashboardShell } from '@/components/dashboard/layout';
import DataPanel from '@/components/page/data-panel';
import { useState, useEffect, useRef } from 'react';
import Search from '@/components/common/search';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import LinkActionButton from '@/components/ui/link-action-button';
import { Permission, SortOrder } from '@/types';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  adminAndOwnerOnly,
  adminOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useRouter } from 'next/router';
import { useShopQuery } from '@/data/shop';
import { useStoreNoticesQuery } from '@/data/store-notice';
import StoreNoticeList from '@/components/store-notice/store-notice-list';
import StoreNoticesSummaryStrip from '@/components/store-notice/store-notices-summary-strip';
import { Config } from '@/config';
import { Routes } from '@/config/routes';
import { useMeQuery } from '@/data/user';

export default function StoreNotices() {
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { locale } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const isSuperAdmin = permissions?.includes(Permission.SuperAdmin);
  const {
    query: { shop },
  } = useRouter();
  const { data: shopData, isLoading: fetchingShop } = useShopQuery({ slug: shop as string });
  const shopId = shopData?.id!;
  const hasRedirectedRef = useRef(false);
  const { storeNotices, paginatorInfo, loading, error } = useStoreNoticesQuery(
    {
      limit: 15,
      shops: shop as string,
      notice: searchTerm,
      page,
      orderBy,
      sortedBy,
    },
    {
      enabled: Boolean(shopId),
    }
  );

  // Check permissions and redirect if user doesn't have access
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Wait for both shop and user data to be loaded before checking permissions
    if (fetchingShop || !shopId || !me) {
      return;
    }

    // Check if user has required permission
    const hasRequiredPermission = hasAccess(adminOnly, permissions);
    // Check if user owns this shop
    const isShopOwner = me?.shops?.map((shop) => shop.id).includes(shopId) ?? false;
    // Check if user manages this shop
    const isManagedShop = me?.managed_shop?.id === shopId;

    // Only redirect if user doesn't have any of the required access
    if (!hasRequiredPermission && !isShopOwner && !isManagedShop) {
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [fetchingShop, shopId, me, permissions, router]);

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
    <DashboardShell>
      <StoreNoticesSummaryStrip
        totalNotices={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('form:input-label-store-notices')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-notice')}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            {locale === Config.defaultLanguage && !isSuperAdmin ? (
              <LinkActionButton
                href={`/${shop}/store-notices/create`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                <span className="hidden xl:block">
                  + {t('form:button-label-add-store-notice')}
                </span>
                <span className="xl:hidden">+ {t('form:button-label-add')}</span>
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <StoreNoticeList
          storeNotices={storeNotices}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </DashboardShell>
  );
}

StoreNotices.authenticate = {
  permissions: adminAndOwnerOnly,
};
StoreNotices.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
