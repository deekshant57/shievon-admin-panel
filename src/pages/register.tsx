import { useTranslation } from 'next-i18next';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import RegistrationForm from '@/components/auth/registration-form';
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
  return (
    <AuthPageLayout>
      <h3 className="mb-6 mt-4 text-center text-base italic text-gray-500">
        {t('admin-register-title')}
      </h3>
      <RegistrationForm />
    </AuthPageLayout>
  );
}
