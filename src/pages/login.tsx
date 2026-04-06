import LoginForm from '@/components/auth/login-form';
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
    ...(await serverSideTranslations(locale!, ['common', 'form'])),
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
      const queryNext = typeof router.query?.next === 'string' ? router.query.next : '';
      const nextPath =
        queryNext.startsWith('/') && !queryNext.startsWith('//')
          ? queryNext
          : Routes.dashboard;
      router.replace(nextPath);
    }
  }, [token, permissions, router]);

  const { t } = useTranslation('common');

  return (
    <AuthPageLayout>
      <h3 className="mb-6 mt-4 text-center text-base italic text-body">
        {t('admin-login-title')}
      </h3>
      <LoginForm />
    </AuthPageLayout>
  );
}
