import CreateOrUpdateProductForm from '@/components/product/product-form';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ShopLayout from '@/components/layouts/shop';
import {
  adminOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useProductQuery } from '@/data/product';
import { Config } from '@/config';
import shop from '@/components/layouts/shop';
import { Routes } from '@/config/routes';
import { useShopQuery } from '@/data/shop';
import { useMeQuery } from '@/data/user';
import Link from '@/components/ui/link';
import { useEffect, useRef } from 'react';

export default function UpdateProductPage() {
  const { query, locale } = useRouter();
  const { t } = useTranslation();
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const { data: shopData, isLoading: fetchingShop } = useShopQuery({
    slug: query?.shop as string,
  });
  const shopId = shopData?.id!;
  const hasRedirectedRef = useRef(false);
  const {
    product,
    isLoading: loading,
    error,
  } = useProductQuery({
    slug: query.productSlug as string,
    language:
      query.action!.toString() === 'edit' ? locale! : Config.defaultLanguage,
  });

  // Step-by-step debug: Edit Product Page (shop - /[shop]/products/[slug]/edit)
  useEffect(() => {
    console.log('[Edit Product Page] state', {
      page: 'shop /[shop]/products/[productSlug]/[action]',
      queryShop: query.shop,
      queryProductSlug: query.productSlug,
      queryAction: query.action,
      loading,
      hasError: !!error,
      errorMessage: error?.message,
      hasProduct: !!product,
      productId: product?.id,
      productName: (product as any)?.name,
      productSlug: (product as any)?.slug,
    });
  }, [query.shop, query.productSlug, query.action, loading, error, product]);

  // Check permissions and redirect if user doesn't have access
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Wait for both shop and user data to be loaded before checking permissions
    if (fetchingShop || !shopId || !me || loading) {
      return;
    }

    // Check if user has required permission (SUPER_ADMIN, STORE_OWNER, or STAFF)
    const hasRequiredPermission = hasAccess(adminOwnerAndStaffOnly, permissions);
    // Check if user owns this shop
    const isShopOwner = me?.shops?.map((shop) => shop.id).includes(shopId) ?? false;
    // Check if user manages this shop
    const isManagedShop = me?.managed_shop?.id === shopId;

    // Only redirect if user doesn't have any of the required access
    if (!hasRequiredPermission && !isShopOwner && !isManagedShop) {
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [fetchingShop, shopId, me, permissions, router, loading]);

  // Wait for route params before fetching (avoids query with undefined slug)
  if (query.action === 'edit' && !query.productSlug) {
    return <Loader text={t('common:text-loading')} />;
  }
  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;
  // When editing, only render form once product is available so defaultValues are pre-filled
  if (query.action === 'edit' && !product) {
    return <Loader text={t('common:text-loading')} />;
  }
  return (
    <>
      <div className="flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:form-title-edit-product')}
        </h1>
      </div>
      <CreateOrUpdateProductForm
        key={`${product?.id ?? 'new'}-${(product as any)?.updated_at ?? ''}`}
        initialValues={product}
      />
    </>
  );
}
UpdateProductPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
UpdateProductPage.Layout = ShopLayout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['form', 'common'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh","productSlug":"__gh","action":"__gh"} }], fallback: false };
}
