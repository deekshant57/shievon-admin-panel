import OwnerLayout from '@/components/layouts/owner';
import ShopForm from '@/components/shop/shop-form';
import PageHeader from '@/components/page/page-header';
import { adminAndOwnerOnly } from '@/utils/auth-utils';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function CreateShopPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form:form-title-create-shop')}
        subtitle={t('common:shops-create-subtitle')}
      />
      <ShopForm />
    </div>
  );
}
CreateShopPage.authenticate = {
  permissions: adminAndOwnerOnly,
};
CreateShopPage.Layout = OwnerLayout;

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common', 'form'])),
  },
});
