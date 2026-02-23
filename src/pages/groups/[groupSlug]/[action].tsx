import Layout from '@/components/layouts/admin';
import { useRouter } from 'next/router';
import CreateOrUpdateTypeForm from '@/components/group/group-form';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTypeQuery } from '@/data/type';
import { Config } from '@/config';
import { adminOnly } from '@/utils/auth-utils';
export default function UpdateTypePage() {
  const { query, locale } = useRouter();
  const { t } = useTranslation();
  const slug = query.groupSlug as string | undefined;
  const isEdit = query.action === 'edit';
  const {
    data,
    isLoading: loading,
    error,
  } = useTypeQuery({
    slug: slug ?? '',
    language: isEdit ? (locale ?? Config.defaultLanguage) : Config.defaultLanguage,
    enabled: !!slug,
  });
  if (!slug || loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;
  if (isEdit && data == null) return <Loader text={t('common:text-loading')} />;
  return (
    <>
      <div className="flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:form-title-edit-type')}
        </h1>
      </div>
      <CreateOrUpdateTypeForm initialValues={data ?? undefined} />
    </>
  );
}
UpdateTypePage.Layout = Layout;

UpdateTypePage.authenticate = {
  permissions: adminOnly,
};

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common'])),
  },
});
