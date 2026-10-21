import DataPanel from '@/components/page/data-panel';
import Search from '@/components/common/search';
import { ArrowDown } from '@/components/icons/arrow-down';
import { ArrowUp } from '@/components/icons/arrow-up';
import { MoreIcon } from '@/components/icons/more-icon';
import ShopLayout from '@/components/layouts/shop';
import CategoryTypeFilter from '@/components/filters/category-type-filter';
import ProductList from '@/components/product/product-list';
import ProductsSummaryStrip from '@/components/product/products-summary-strip';
import ErrorMessage from '@/components/ui/error-message';
import LinkActionButton from '@/components/ui/link-action-button';
import ActionButton from '@/components/ui/action-button';
import Loader from '@/components/ui/loader/loader';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { Config } from '@/config';
import { Routes } from '@/config/routes';
import ProductBulkImportMenu from '@/components/product/product-bulk-import-menu';
import { useProductsQuery } from '@/data/product';
import { useShopQuery } from '@/data/shop';
import { useMeQuery } from '@/data/user';
import { Category, SortOrder, Type } from '@/types';
import {
  adminAndOwnerOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { STORE_OWNER, SUPER_ADMIN } from '@/utils/constants';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { isServiceType } from '@/utils/service-type';
import { DashboardShell } from '@/components/dashboard/layout';

interface ProductTypeOptions {
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const { permissions, role } = getAuthCredentials();
  const { data: me, isLoading: fetchingMe } = useMeQuery();
  const {
    query: { shop },
    locale,
  } = useRouter();
  const {
    data: shopData,
    isLoading: fetchingShop,
    error: shopError,
  } = useShopQuery({
    slug: shop as string,
  });
  const shopId = shopData?.id;
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const [visible, setVisible] = useState(true);
  const { openModal } = useModalAction();
  const hasRedirectedRef = useRef(false);
  const isShopOwner = me?.shops?.some((s) => s.id === shopId) ?? false;
  const canImportClothing =
    hasAccess(adminAndOwnerOnly, permissions) ||
    role === SUPER_ADMIN ||
    role === STORE_OWNER ||
    isShopOwner;

  const toggleVisible = () => {
    setVisible((v) => !v);
  };

  const { products, paginatorInfo, loading, error } = useProductsQuery(
    {
      language: locale,
      name: searchTerm,
      limit: 20,
      shop_id: shopId,
      type,
      categories: category,
      product_type: productType,
      orderBy,
      sortedBy,
      page,
    },
    {
      enabled: Boolean(shopId),
    },
  );

  const filteredProducts = (products ?? []).filter(
    (p: any) => !isServiceType(p?.type),
  );

  function handleImportModal() {
    openModal('EXPORT_IMPORT_PRODUCT', shopId);
  }

  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }

    if (fetchingShop || fetchingMe || !shopId || !me) {
      return;
    }

    const hasRequiredPermission = hasAccess(adminOwnerAndStaffOnly, permissions);
    const ownsShop = me?.shops?.some((s) => s.id === shopId) ?? false;
    const isManagedShop = me?.managed_shop?.id === shopId;

    if (!hasRequiredPermission && !ownsShop && !isManagedShop) {
      hasRedirectedRef.current = true;
      window.location.href = Routes.dashboard;
    }
  }, [fetchingShop, fetchingMe, shopId, me, permissions]);

  if (loading || fetchingShop || fetchingMe) {
    return <Loader text={t('common:text-loading')} />;
  }

  if (error) return <ErrorMessage message={error.message} />;
  if (shopError) {
    return (
      <ErrorMessage
        message={t('common:error-shop-not-found') || 'Shop not found'}
      />
    );
  }

  if (!fetchingShop && !shopId) {
    return (
      <ErrorMessage
        message={t('common:error-shop-not-found') || 'Shop not found'}
      />
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

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
              {canImportClothing ? (
                <ProductBulkImportMenu
                  shop={shop as string}
                  variant="soft"
                  className="col-span-2 sm:col-span-1"
                />
              ) : null}
              {locale === Config.defaultLanguage ? (
                <LinkActionButton
                  href={`/${shop}/products/create`}
                  variant="primary"
                  size="sm"
                  className="w-full justify-center sm:w-auto"
                >
                  <span className="hidden sm:inline">
                    + {t('form:button-label-add-product')}
                  </span>
                  <span className="sm:hidden">
                    + {t('form:button-label-add')}
                  </span>
                </LinkActionButton>
              ) : null}
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
              <ActionButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleImportModal}
                className="col-span-2 w-full justify-center sm:hidden"
              >
                {t('common:text-export-import')}
              </ActionButton>
              <ActionButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleImportModal}
                className="hidden w-auto justify-center sm:inline-flex"
                aria-label={t('common:text-export-import')}
              >
                <MoreIcon className="h-3.5 w-3.5" />
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
              typeNameDenyList={['Cafe', 'Salon']}
            />
          ) : undefined
        }
      >
        <ProductList
          products={filteredProducts}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </DashboardShell>
  );
}
ProductsPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
ProductsPage.Layout = ShopLayout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
}
