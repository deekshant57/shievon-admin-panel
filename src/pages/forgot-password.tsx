import ForgotPasswordForm from '@/components/auth/forget-password/forget-password';
import { AuthFooter, AuthHeader } from '@/components/auth/layout';
import Link from '@/components/ui/link';
import AuthPageLayout from '@/components/layouts/auth-layout';
import { Routes } from '@/config/routes';
import { SUPER_ADMIN } from '@/utils/constants';
import { parseContextCookie } from '@/utils/parse-cookie';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getServerSideProps: GetServerSideProps = async ({
  context,
  locale,
}: any) => {
  const cookies = parseContextCookie(context?.req?.headers?.cookie);
  if (cookies?.auth_token) {
    if (cookies?.auth_permissions?.includes(SUPER_ADMIN)) {
      return {
        redirect: { destination: Routes.dashboard, permanent: false },
      };
    }
  }
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common', 'form'])),
    },
  };
};

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  const loginLabel =
    t('form:button-label-login') === 'form:button-label-login'
      ? 'Login'
      : t('form:button-label-login');

  return (
    <AuthPageLayout variant="admin">
      <AuthHeader
        title={t('form:form-title-forgot-password')}
        subtitle={t('common:auth-forgot-subtitle')}
      />
      <ForgotPasswordForm />
      <AuthFooter className="mt-8">
        <Link
          href={Routes.login}
          className="font-semibold text-accent underline transition-colors duration-200 hover:text-accent-hover hover:no-underline focus:text-accent-700 focus:no-underline focus:outline-none"
        >
          {t('form:text-back-to-login') || `Back to ${loginLabel}`}
        </Link>
      </AuthFooter>
    </AuthPageLayout>
  );
}
