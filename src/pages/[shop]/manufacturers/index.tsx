import Search from '@/components/common/search';
import ManufacturerList from '@/components/manufacturer/manufacturer-list';
import ManufacturersSummaryStrip from '@/components/manufacturer/manufacturers-summary-strip';
import LinkActionButton from '@/components/ui/link-action-button';
import DataPanel from '@/components/page/data-panel';
import { DashboardShell } from '@/components/dashboard/layout';
import { useState, useEffect, useRef } from 'react';
import { LIMIT } from '@/utils/constants';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Routes } from '@/config/routes';
import ShopLayout from '@/components/layouts/shop';
import {
  adminOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useRouter } from 'next/router';
import { SortOrder } from '@/types';
import { useManufacturersQuery } from '@/data/manufacturer';
import { Config } from '@/config';
import { useMeQuery } from '@/data/user';
import { useShopQuery } from '@/data/shop';

export default function Manufacturers() {
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const { t } = useTranslation();
  const {
    query: { shop },
    locale,
  } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { manufacturers, paginatorInfo, loading, error } =
    useManufacturersQuery({
      limit: LIMIT,
      orderBy,
      sortedBy,
      name: searchTerm,
      page,
      language: locale,
    });

  const { data: shopData, isLoading: fetchingShop } = useShopQuery({
    slug: shop as string,
  });
  const { id: shop_id } = shopData ?? {};
  const hasRedirectedRef = useRef(false);

  // Check permissions and redirect if user doesn't have access
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Wait for both shop and user data to be loaded before checking permissions
    if (fetchingShop || !shop_id || !me) {
      return;
    }

    // Check if user has required permission
    const hasRequiredPermission = hasAccess(adminOnly, permissions);
    // Check if user owns this shop
    const isShopOwner = me?.shops?.map((shop) => shop.id).includes(shop_id) ?? false;
    // Check if user manages this shop
    const isManagedShop = me?.managed_shop?.id === shop_id;

    // Only redirect if user doesn't have any of the required access
    if (!hasRequiredPermission && !isShopOwner && !isManagedShop) {
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [fetchingShop, shop_id, me, permissions, router]);

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
  }

  function handlePagination(current: number) {
    setPage(current);
  }

  return (
    <DashboardShell>
      <ManufacturersSummaryStrip
        totalManufacturers={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('common:text-manufacturers-publications')}
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
            {locale === Config.defaultLanguage ? (
              <LinkActionButton
                href={`/${shop}${Routes.manufacturer.create}`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                + {t('form:button-label-add-manufacturer-publication')}
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <ManufacturerList
          manufacturers={manufacturers}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </DashboardShell>
  );
}
Manufacturers.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
Manufacturers.Layout = ShopLayout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
}
