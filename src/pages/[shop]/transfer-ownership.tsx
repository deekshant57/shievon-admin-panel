import ShopLayout from '@/components/layouts/shop';
import TransferShopOwnershipForm from '@/components/shop/transfer-ownership-shop-form';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import NotFound from '@/components/ui/not-found';
import { Routes } from '@/config/routes';
import { useShopQuery } from '@/data/shop';
import { useMeQuery, useVendorsQuery } from '@/data/user';
import { OwnerShipTransferStatus, Shop } from '@/types';
import {
  adminAndOwnerOnly,
  adminOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { OWNERSHIP_TRANSFER_STATUS } from '@/utils/constants';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

export default function TransferShopOwnershipPage() {
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const { query } = useRouter();
  const { shop } = query;
  const { t } = useTranslation();
  const hasRedirectedRef = useRef(false);

  const {
    data,
    isLoading: loading,
    error,
  } = useShopQuery({
    slug: shop as string,
  });
  const {
    vendors,
    loading: vendorLoading,
    error: vendorError,
  } = useVendorsQuery({
    is_active: true,
    shop_id: data?.id!,
    exclude: data?.owner_id,
  });

  // Check permissions and redirect if user doesn't have access
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Wait for data to be loaded before checking permissions
    if (loading || vendorLoading || !data?.id || !me) {
      return;
    }

    // Check if user has required permission
    const hasRequiredPermission = hasAccess(adminOnly, permissions);
    // Check if user owns this shop
    const isShopOwner = me?.shops?.map((shop) => shop.id).includes(data.id) ?? false;
    // Check if user manages this shop
    const isManagedShop = me?.managed_shop?.id === data.id;

    // Only redirect if user doesn't have any of the required access
    if (!hasRequiredPermission && !isShopOwner && !isManagedShop) {
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [loading, vendorLoading, data?.id, me, permissions, router]);

  if (loading || vendorLoading)
    return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;
  if (vendorError) return <ErrorMessage message={vendorError.message} />;

  return (
    <>
      <div className="flex py-5 border-b border-dashed border-border-base sm:py-8">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:form-title-transfer-shop-ownership')}
        </h1>
      </div>
      {OWNERSHIP_TRANSFER_STATUS?.includes(
        data?.ownership_history?.status as OwnerShipTransferStatus,
      ) ? (
        <NotFound
          className="mt-10"
          text={`Shop transfer already in ${data?.ownership_history?.status} state! ✋`}
        />
      ) : (
        <TransferShopOwnershipForm shop={data as Shop} vendors={vendors} />
      )}
    </>
  );
}
TransferShopOwnershipPage.authenticate = {
  permissions: adminAndOwnerOnly,
};
TransferShopOwnershipPage.Layout = ShopLayout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['form', 'common'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
}
