import ShopLayout from '@/components/layouts/shop';
import CreateOrUpdateProductForm from '@/components/product/product-form';
import Alert from '@/components/ui/alert';
import Link from '@/components/ui/link';
import { Routes } from '@/config/routes';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  adminAndOwnerOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { STORE_OWNER, SUPER_ADMIN } from '@/utils/constants';
import { useRouter } from 'next/router';

export default function CreateProductPage() {
  const { t } = useTranslation();
  const { permissions, role } = getAuthCredentials();
  const {
    query: { shop },
  } = useRouter();
  const canImportClothing =
    hasAccess(adminAndOwnerOnly, permissions) ||
    role === SUPER_ADMIN ||
    role === STORE_OWNER;

  return (
    <>
      <div className="flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:form-title-create-product')}
        </h1>
      </div>
      {canImportClothing && (
        <Alert
          className="my-5"
          variant="info"
          message={t('common:clothing-import-create-page-hint')}
        >
          <Link
            href={Routes.product.clothingImport(shop as string)}
            className="mt-2 inline-block text-sm font-semibold text-accent hover:text-accent-hover"
          >
            {t('common:clothing-import-create-page-link')}
          </Link>
        </Alert>
      )}
      <CreateOrUpdateProductForm />
    </>
  );
}
CreateProductPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
CreateProductPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common'])),
  },
});
