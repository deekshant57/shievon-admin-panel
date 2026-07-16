import Layout from '@/components/layouts/admin'
import ServiceCategoryForm from '@/components/service-category/service-category-form'
import PageHeader from '@/components/page/page-header'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import { useServiceCategoryQuery } from '@/data/service-category'
import { adminOnly } from '@/utils/auth-utils'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'

export default function EditServiceCategoryPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const param = router.query.param as string | undefined
  const isEdit = router.query.action === 'edit'

  const { serviceCategory, isLoading, error } = useServiceCategoryQuery({
    param,
    enabled: Boolean(param) && isEdit,
  })

  if (!param || isLoading) return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={error.message} />
  if (isEdit && serviceCategory == null)
    return <Loader text={t('common:text-loading')} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form:form-title-edit-service-category')}
        subtitle={
          serviceCategory?.name
            ? t('common:service-categories-edit-subtitle', {
                name: serviceCategory.name,
              })
            : t('common:service-categories-edit-subtitle-generic')
        }
      />
      <ServiceCategoryForm initialValues={serviceCategory ?? undefined} />
    </div>
  )
}

EditServiceCategoryPage.authenticate = {
  permissions: adminOnly,
}
EditServiceCategoryPage.Layout = Layout

export const getServerSideProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})
