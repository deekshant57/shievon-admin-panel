import Layout from '@/components/layouts/admin';
import CustomerCreateForm from '@/components/user/user-form';
import PageHeader from '@/components/page/page-header';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function CreateCustomerPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form:form-title-create-customer')}
        subtitle={t('common:users-create-subtitle')}
      />
      <CustomerCreateForm />
    </div>
  );
}
CreateCustomerPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'form', 'common'])),
  },
});
