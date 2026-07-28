import Search from '@/components/common/search';
import FlashSaleProductListForVendor from '@/components/flash-sale/flash-sale-product-list-for-vendor';
import FlashSalesSummaryStrip from '@/components/flash-sale/flash-sales-summary-strip';
import ShopLayout from '@/components/layouts/shop';
import { DashboardShell } from '@/components/dashboard/layout';
import DataPanel from '@/components/page/data-panel';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { Routes } from '@/config/routes';
import { useProductsQuery } from '@/data/product';
import { useShopQuery } from '@/data/shop';
import { useMeQuery } from '@/data/user';
import { SortOrder } from '@/types';
import {
  adminOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function VendorFlashSalePage() {
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

  const { data: shopData } = useShopQuery({
    slug: shop as string,
  });
  const { id: shop_id } = shopData ?? {};

  const { products, paginatorInfo, loading, error } = useProductsQuery(
    {
      language: locale,
      name: searchTerm,
      limit: 20,
      shop_id: shop_id,
      orderBy,
      sortedBy,
      page,
      flash_sale_builder: Boolean(true),
    },
    {
      enabled: Boolean(shop_id),
    }
  );

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
    !me?.shops?.map((shop) => shop.id).includes(shop_id) &&
    me?.managed_shop?.id != shop_id
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
        title={t('form:form-title-my-products-flash-sales')}
        toolbarLayout="stacked"
        toolbar={
          <Search
            onSearch={handleSearch}
            debounceMs={400}
            variant="hybrid"
            size="sm"
            className="w-full"
          />
        }
      >
        <FlashSaleProductListForVendor
          products={products}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
        />
      </DataPanel>
    </DashboardShell>
  );
}
VendorFlashSalePage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
VendorFlashSalePage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
