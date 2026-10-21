import LoginForm from '@/components/auth/login-form';
import {
  AuthDivider,
  AuthFooter,
  AuthHeader,
} from '@/components/auth/layout';
import Link from '@/components/ui/link';
import { useTranslation } from 'next-i18next';
import type { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getAuthCredentials, isAuthenticated } from '@/utils/auth-utils';
import { useRouter } from 'next/router';
import AuthPageLayout from '@/components/layouts/auth-layout';
import { Routes } from '@/config/routes';
import { useEffect, useRef } from 'react';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common', 'form'])),
  },
});

export default function LoginPage() {
  const router = useRouter();
  const { token, permissions } = getAuthCredentials();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }
    if (isAuthenticated({ token, permissions })) {
      hasRedirectedRef.current = true;
      const queryNext =
        typeof router.query?.next === 'string' ? router.query.next : '';
      const nextPath =
        queryNext.startsWith('/') && !queryNext.startsWith('//')
          ? queryNext
          : Routes.dashboard;
      router.replace(nextPath);
    }
  }, [token, permissions, router]);

  const { t } = useTranslation('common');

  return (
    <AuthPageLayout variant="admin">
      <AuthHeader
        title={t('admin-login-title')}
        subtitle={t('auth-login-subtitle')}
      />
      <LoginForm />
      <AuthDivider />
      <AuthFooter>
        {t('form:text-no-account')}{' '}
        <Link
          href={Routes.register}
          className="font-semibold text-accent underline transition-colors duration-200 ms-1 hover:text-accent-hover hover:no-underline focus:text-accent-700 focus:no-underline focus:outline-none"
        >
          {t('form:link-register-shop-owner')}
        </Link>
      </AuthFooter>
    </AuthPageLayout>
  );
}
