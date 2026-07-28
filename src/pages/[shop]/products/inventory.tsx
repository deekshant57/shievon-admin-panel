import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState, useEffect, useRef } from 'react';
import Search from '@/components/common/search';
import { useProductsQuery } from '@/data/product';
import { useRouter } from 'next/router';
import ProductInventoryList from '@/components/product/product-inventory-list';
import ProductsSummaryStrip from '@/components/product/products-summary-strip';
import { useMeQuery } from '@/data/user';
import {
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useShopQuery } from '@/data/shop';
import ShopLayout from '@/components/layouts/shop';
import { Routes } from '@/config/routes';
import CategoryTypeFilter from '@/components/filters/category-type-filter';
import { ArrowDown } from '@/components/icons/arrow-down';
import { ArrowUp } from '@/components/icons/arrow-up';
import { Category, SortOrder, Type } from '@/types';
import DataPanel from '@/components/page/data-panel';
import ActionButton from '@/components/ui/action-button';
import { DashboardShell } from '@/components/dashboard/layout';

interface ProductTypeOptions {
  name: string;
  slug: string;
}

export default function VendorProductInventoryPage() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me, isLoading: fetchingMe } = useMeQuery();
  const {
    query: { shop },
  } = useRouter();
  const {
    data: shopData,
    isLoading: fetchingShop,
    error: shopError,
  } = useShopQuery({
    slug: shop as string,
  });
  const shopId = shopData?.id;
  const hasRedirectedRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const [visible, setVisible] = useState(true);
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState('');

  const toggleVisible = () => {
    setVisible((v) => !v);
  };

  const { products, paginatorInfo, loading, error } = useProductsQuery(
    {
      language: locale,
      name: searchTerm,
      limit: 20,
      page,
      orderBy,
      sortedBy,
      shop_id: shopId,
      categories: category,
      product_type: productType,
      type,
    },
    {
      enabled: Boolean(shopId),
    },
  );

  // Check permissions and redirect if user doesn't have access
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Wait for both shop and user data to be loaded before checking permissions
    if (fetchingShop || fetchingMe || !shopId || !me) {
      return;
    }

    // Check if user has required permission (SUPER_ADMIN, STORE_OWNER, or STAFF)
    const hasRequiredPermission = hasAccess(adminOwnerAndStaffOnly, permissions);
    // Check if user owns this shop
    const isShopOwner = me?.shops?.some((shop) => shop.id === shopId) ?? false;
    // Check if user manages this shop
    const isManagedShop = me?.managed_shop?.id === shopId;

    // Only redirect if user doesn't have any of the required access
    if (!hasRequiredPermission && !isShopOwner && !isManagedShop) {
      hasRedirectedRef.current = true;
      // Use window.location.href instead of router.replace to avoid interfering
      // with Next.js router's initial props loading lifecycle
      window.location.href = Routes.dashboard;
    }
  }, [fetchingShop, fetchingMe, shopId, me, permissions]);

  // Show loading state while fetching data
  if (loading || fetchingShop || fetchingMe) {
    return <Loader text={t('common:text-loading')} />;
  }

  // Handle errors
  if (error) return <ErrorMessage message={error.message} />;
  if (shopError) {
    return (
      <ErrorMessage message={t('common:error-shop-not-found') || 'Shop not found'} />
    );
  }

  // Handle case where shop is not found or shopId is missing
  if (!fetchingShop && !shopId) {
    return (
      <ErrorMessage message={t('common:error-shop-not-found') || 'Shop not found'} />
    );
  }

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
              placeholderText={t('form:input-placeholder-search-name')}
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
              type={type}
              onCategoryFilter={(category: Category) => {
                setCategory(category?.slug!);
                setPage(1);
              }}
              onTypeFilter={(type: Type) => {
                setType(type?.slug!);
                setPage(1);
              }}
              onProductTypeFilter={(productType: ProductTypeOptions) => {
                setProductType(productType?.slug!);
                setPage(1);
              }}
              enableCategory
              enableType
              enableProductType
            />
          ) : undefined
        }
      >
        <ProductInventoryList
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

VendorProductInventoryPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
VendorProductInventoryPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
