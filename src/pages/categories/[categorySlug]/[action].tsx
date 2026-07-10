import Layout from '@/components/layouts/admin';
import CreateOrUpdateCategoriesForm from '@/components/category/category-form';
import PageHeader from '@/components/page/page-header';
import { useRouter } from 'next/router';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useCategoryQuery } from '@/data/category';
import { Config } from '@/config';

export default function UpdateCategoriesPage() {
  const { query, locale } = useRouter();
  const { t } = useTranslation();
  const action = query.action?.toString();
  const {
    category,
    isLoading: loading,
    error,
  } = useCategoryQuery({
    slug: query.categorySlug as string,
    language: action === 'edit' ? locale! : Config.defaultLanguage,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  const pageTitle =
    action === 'translate'
      ? t('common:categories-translate-title')
      : t('form:form-title-edit-category');

  const pageSubtitle =
    action === 'translate'
      ? t('common:categories-translate-subtitle', { name: category?.name ?? '' })
      : category?.name
        ? t('common:categories-edit-subtitle', { name: category.name })
        : t('common:categories-edit-subtitle-generic');

  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />
      <CreateOrUpdateCategoriesForm initialValues={category} />
    </div>
  );
}

UpdateCategoriesPage.Layout = Layout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common'])),
  },
});
