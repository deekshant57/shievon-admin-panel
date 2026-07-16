import Layout from '@/components/layouts/admin'
import CreateOrUpdateTypeForm from '@/components/group/group-form'
import PageHeader from '@/components/page/page-header'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import { Config } from '@/config'
import { useTypeQuery } from '@/data/type'
import { adminOnly } from '@/utils/auth-utils'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'

export default function UpdateServiceTypePage() {
  const { query, locale } = useRouter()
  const { t } = useTranslation()
  const slug = query.groupSlug as string | undefined
  const isEdit = query.action === 'edit'
  const {
    data,
    isLoading: loading,
    error,
  } = useTypeQuery({
    slug: slug ?? '',
    language: isEdit ? (locale ?? Config.defaultLanguage) : Config.defaultLanguage,
    enabled: !!slug,
  })

  if (!slug || loading) return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={error.message} />
  if (isEdit && data == null) return <Loader text={t('common:text-loading')} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form:form-title-edit-type')}
        subtitle={
          data?.name
            ? t('common:service-types-edit-subtitle', {
                name: data.name,
              })
            : t('common:service-types-edit-subtitle-generic')
        }
      />
      <CreateOrUpdateTypeForm initialValues={data ?? undefined} />
    </div>
  )
}

UpdateServiceTypePage.authenticate = {
  permissions: adminOnly,
}
UpdateServiceTypePage.Layout = Layout

export const getServerSideProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})
