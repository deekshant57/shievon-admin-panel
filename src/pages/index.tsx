import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  allowedRoles,
  getAuthCredentials,
  hasAccess,
  isAuthenticated,
} from '@/utils/auth-utils';
import { SUPER_ADMIN } from '@/utils/constants';
import AppLayout from '@/components/layouts/app';
import { Routes } from '@/config/routes';

const AdminDashboard = dynamic(() => import('@/components/dashboard/admin'));
const OwnerDashboard = dynamic(() => import('@/components/dashboard/owner'));

export default function Dashboard() {
  const router = useRouter();
  const { token, permissions } = getAuthCredentials();
  const authenticated =
    isAuthenticated({ token, permissions }) &&
    hasAccess(allowedRoles, permissions);

  useEffect(() => {
    if (!authenticated) {
      router.replace(Routes.login);
    }
  }, [authenticated, router]);

  if (!authenticated) return null;
  if (permissions?.includes(SUPER_ADMIN)) {
    return <AdminDashboard />;
  }
  return <OwnerDashboard />;
}

Dashboard.Layout = AppLayout;

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', [
          'common',
          'form',
          'table',
          'widgets',
        ])),
  },
});
