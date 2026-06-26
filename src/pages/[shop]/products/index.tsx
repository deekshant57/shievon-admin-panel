import DataPanel from '@/components/page/data-panel';
import Search from '@/components/common/search';
import { ArrowDown } from '@/components/icons/arrow-down';
import { ArrowUp } from '@/components/icons/arrow-up';
import { MoreIcon } from '@/components/icons/more-icon';
import ShopLayout from '@/components/layouts/shop';
import CategoryTypeFilter from '@/components/filters/category-type-filter';
import ProductList from '@/components/product/product-list';
import Button from '@/components/ui/button';
import ErrorMessage from '@/components/ui/error-message';
import LinkButton from '@/components/ui/link-button';
import Loader from '@/components/ui/loader/loader';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { Config } from '@/config';
import { Routes } from '@/config/routes';
import ClothingImportAnnouncement from '@/components/product/clothing-import-announcement';
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

interface ProductTypeOptions {
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const { permissions, role } = getAuthCredentials();
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
  const { locale } = useRouter();
  const hasRedirectedRef = useRef(false);
  const isShopOwner = me?.shops?.some((shop) => shop.id === shopId) ?? false;
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

  const filteredProducts = (products ?? []).filter((p: any) => !isServiceType(p?.type));

  function handleImportModal() {
    openModal('EXPORT_IMPORT_PRODUCT', shopId);
  }

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
    const ownsShop = me?.shops?.some((shop) => shop.id === shopId) ?? false;
    // Check if user manages this shop
    const isManagedShop = me?.managed_shop?.id === shopId;

    // Only redirect if user doesn't have any of the required access
    if (!hasRequiredPermission && !ownsShop && !isManagedShop) {
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
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  return (
    <>
      <DataPanel
        title={t('form:input-label-products')}
        toolbar={
          <>
            <div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
              <Search
                onSearch={handleSearch}
                placeholderText={t('form:input-placeholder-search-name')}
              />
              <div className="flex flex-wrap items-center gap-3 md:ms-4">
                {canImportClothing ? (
                  <ProductBulkImportMenu
                    shop={shop as string}
                    className="hidden whitespace-nowrap md:flex"
                  />
                ) : null}
                {locale === Config.defaultLanguage ? (
                  <LinkButton
                    href={`/${shop}/products/create`}
                    className="h-12"
                  >
                    <span className="hidden md:block">
                      + {t('form:button-label-add-product')}
                    </span>
                    <span className="md:hidden">
                      + {t('form:button-label-add')}
                    </span>
                  </LinkButton>
                ) : null}
                <button
                  className="flex items-center whitespace-nowrap text-base font-semibold text-accent"
                  onClick={toggleVisible}
                >
                  {t('common:text-filter')}{' '}
                  {visible ? (
                    <ArrowUp className="ms-2" />
                  ) : (
                    <ArrowDown className="ms-2" />
                  )}
                </button>
                <button
                  onClick={handleImportModal}
                  className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 transition-colors duration-200 hover:bg-gray-100 md:flex"
                >
                  <MoreIcon className="w-3.5 text-body" />
                </button>
              </div>
            </div>
            {canImportClothing ? (
              <ProductBulkImportMenu
                shop={shop as string}
                fullWidth
                className="mt-4 md:hidden"
              />
            ) : null}
            <Button
              onClick={handleImportModal}
              className="mt-4 w-full md:hidden"
            >
              {t('common:text-export-import')}
            </Button>
          </>
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
      <ClothingImportAnnouncement
        shop={shop as string}
        canShow={canImportClothing}
      />
    </>
  );
}
ProductsPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
ProductsPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
