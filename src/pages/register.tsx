import { useTranslation } from 'next-i18next';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import RegistrationForm from '@/components/auth/registration-form';
import {
  AuthDivider,
  AuthFooter,
  AuthHeader,
} from '@/components/auth/layout';
import Link from '@/components/ui/link';
import { useRouter } from 'next/router';
import { getAuthCredentials, isAuthenticated } from '@/utils/auth-utils';
import { Routes } from '@/config/routes';
import AuthPageLayout from '@/components/layouts/auth-layout';
import { useEffect, useRef } from 'react';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common', 'form'])),
  },
});

export default function RegisterPage() {
  const router = useRouter();
  const { token, permissions } = getAuthCredentials();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }
    if (isAuthenticated({ token, permissions })) {
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [token, permissions, router]);

  const { t } = useTranslation('common');

  const loginLabel =
    t('form:button-label-login') === 'form:button-label-login'
      ? 'Login'
      : t('form:button-label-login');

  return (
    <AuthPageLayout variant="vendor" formWidth="lg">
      <AuthHeader
        title={t('admin-register-title')}
        subtitle={t('auth-register-subtitle')}
      />
      <RegistrationForm />
      <AuthDivider />
      <AuthFooter>
        {t('form:text-have-account') || 'Already have an account?'}{' '}
        <Link
          href={Routes.login}
          className="font-semibold text-accent underline transition-colors duration-200 ms-1 hover:text-accent-hover hover:no-underline focus:text-accent-700 focus:no-underline focus:outline-none"
        >
          {loginLabel}
        </Link>
      </AuthFooter>
    </AuthPageLayout>
  );
}
