import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ShopLayout from '@/components/layouts/shop';
import {
  adminOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { Routes } from '@/config/routes';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import Loader from '@/components/ui/loader/loader';

/**
 * Legacy per-shop create URL.
 * Admin create-payout now lives at /withdraws/create (global hub with shop picker).
 * Keep this route as a redirect so old bookmarks still work.
 */
export default function CreateWithdrawPageRedirect() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    query: { shop },
  } = router;
  const { permissions } = getAuthCredentials();
  const hasRedirectedRef = useRef(false);
  const isAdmin = hasAccess(adminOnly, permissions);

  useEffect(() => {
    if (hasRedirectedRef.current || !router.isReady) return;
    hasRedirectedRef.current = true;

    if (!isAdmin) {
      router.replace(shop ? `/${shop}${Routes.withdraw.list}` : Routes.dashboard);
      return;
    }

    const qs = shop ? `?shop=${encodeURIComponent(String(shop))}` : '';
    router.replace(`${Routes.withdraw.create}${qs}`);
  }, [isAdmin, router, shop]);

  return <Loader text={t('common:text-loading')} />;
}
CreateWithdrawPageRedirect.authenticate = {
  permissions: adminOnly,
};
CreateWithdrawPageRedirect.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common'])),
  },
});
