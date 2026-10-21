import { useState } from 'react';
import Search from '@/components/common/search';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import LinkActionButton from '@/components/ui/link-action-button';
import DataPanel from '@/components/page/data-panel';
import { DashboardShell } from '@/components/dashboard/layout';
import FlashSalesSummaryStrip from '@/components/flash-sale/flash-sales-summary-strip';
import { LIMIT } from '@/utils/constants';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ShopLayout from '@/components/layouts/shop';
import {
  adminOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { Routes } from '@/config/routes';
import { useMeQuery } from '@/data/user';
import { useRouter } from 'next/router';
import { useShopQuery } from '@/data/shop';
import { Config } from '@/config';
import FlashSaleRequestLists from '@/components/flash-sale/vendor-request/flash-sale-vendor-request-list';
import { useRequestedListsForFlashSale } from '@/data/flash-sale-vendor-request';
import { SortOrder } from '@/types';

export default function FlashSaleVendorRequestLists() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = useRouter();
  const {
    query: { shop },
  } = useRouter();
  const { permissions } = getAuthCredentials();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);

  const { data: me } = useMeQuery();
  const { data: shopData } = useShopQuery({
    slug: shop as string,
  });
  const shopId = shopData?.id!;

  const { flashSaleRequests, paginatorInfo, loading, error } =
    useRequestedListsForFlashSale({
      limit: LIMIT,
      orderBy,
      sortedBy,
      title: searchTerm,
      page,
      language: locale,
    });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
  }

  function handlePagination(current: number) {
    setPage(current);
  }

  if (
    !hasAccess(adminOnly, permissions) &&
    !me?.shops?.map((shop) => shop.id).includes(shopId) &&
    me?.managed_shop?.id != shopId
  ) {
    router.replace(Routes.dashboard);
  }

  return (
    <DashboardShell>
      <FlashSalesSummaryStrip
        totalCampaigns={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title="Lists of created flash sale requests."
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            {locale === Config.defaultLanguage ? (
              <LinkActionButton
                href={`/${shop}/flash-sale/vendor-request/create`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                <span className="hidden xl:block">+ Create Request</span>
                <span className="xl:hidden">+ {t('form:button-label-add')}</span>
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <FlashSaleRequestLists
          flashSaleRequests={flashSaleRequests}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </DashboardShell>
  );
}
FlashSaleVendorRequestLists.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
FlashSaleVendorRequestLists.Layout = ShopLayout;
export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common', 'form', 'table'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
}
