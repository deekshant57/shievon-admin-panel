import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ProductList from '@/components/product/product-list';
import { useState } from 'react';
import Search from '@/components/common/search';
import { Category, SortOrder } from '@/types';
import { useProductStockQuery } from '@/data/product';
import { useRouter } from 'next/router';
import CategoryTypeFilter from '@/components/filters/category-type-filter';
import { ArrowDown } from '@/components/icons/arrow-down';
import { ArrowUp } from '@/components/icons/arrow-up';
import { useMeQuery } from '@/data/user';
import {
  adminOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useShopQuery } from '@/data/shop';
import ShopLayout from '@/components/layouts/shop';
import { Routes } from '@/config/routes';
import DataPanel from '@/components/page/data-panel';
import ProductsSummaryStrip from '@/components/product/products-summary-strip';
import ActionButton from '@/components/ui/action-button';
import { useEffect, useRef } from 'react';
import { DashboardShell } from '@/components/dashboard/layout';

export default function VendorProductStockPage() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const {
    query: { shop },
  } = useRouter();
  const { data: shopData, isLoading: fetchingShop } = useShopQuery({
    slug: shop as string,
  });
  const shopId = shopData?.id!;
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const [visible, setVisible] = useState(false);
  const hasRedirectedRef = useRef(false);

  const toggleVisible = () => {
    setVisible((v) => !v);
  };

  const { products, paginatorInfo, loading, error } = useProductStockQuery({
    name: searchTerm,
    limit: 10,
    page,
    orderBy,
    sortedBy,
    shop_id: shopId,
    language: locale,
    categories: category,
    type,
  });

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
      <ProductsSummaryStrip
        totalProducts={shopData?.products_count}
        matchingResults={paginatorInfo?.total}
        totalOrders={shopData?.orders_count}
      />

      <DataPanel
        className="mb-0"
        title={t('form:input-label-products')}
        toolbarLayout="stacked"
        subtitle={
          shopData?.name
            ? t('common:products-page-subtitle', { shop: shopData.name })
            : undefined
        }
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
              onCategoryFilter={(categories: Category) => {
                setPage(1);
                setCategory(categories?.slug);
              }}
              onTypeFilter={(categories: Category) => {
                setType(categories?.slug);
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
    </DashboardShell>
  );
}

VendorProductStockPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
VendorProductStockPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
