import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ShopForm from '@/components/shop/shop-form';
import ShopLayout from '@/components/layouts/shop';
import PageHeader from '@/components/page/page-header';
import { adminAndOwnerOnly } from '@/utils/auth-utils';
import { useShopQuery } from '@/data/shop';

export default function UpdateShopPage() {
  const { query } = useRouter();
  const { shop } = query;
  const { t } = useTranslation();
  const {
    data,
    isLoading: loading,
    error,
  } = useShopQuery({
    slug: shop as string,
  });
  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form:form-title-edit-shop')}
        subtitle={
          data?.name
            ? t('common:shops-edit-subtitle', { name: data.name })
            : t('common:shops-edit-subtitle-generic')
        }
      />
      <ShopForm initialValues={data} />
    </div>
  );
}
UpdateShopPage.authenticate = {
  permissions: adminAndOwnerOnly,
};
UpdateShopPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common'])),
  },
});
