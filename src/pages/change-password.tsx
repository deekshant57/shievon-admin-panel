import Layout from '@/components/layouts/app';
import ChangePasswordForm from '@/components/auth/change-password-from';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ChangePasswordPage() {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:button-label-change-password')}
        </h1>
      </div>
      <ChangePasswordForm />
    </>
  );
}

ChangePasswordPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common'])),
  },
});
