import Layout from '@/components/layouts/admin'
import ServiceCategoryForm from '@/components/service-category/service-category-form'
import PageHeader from '@/components/page/page-header'
import { adminOnly } from '@/utils/auth-utils'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function CreateServiceCategoryPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form:form-title-create-service-category')}
        subtitle={t('common:service-categories-create-subtitle')}
      />
      <ServiceCategoryForm />
    </div>
  )
}

CreateServiceCategoryPage.authenticate = {
  permissions: adminOnly,
}
CreateServiceCategoryPage.Layout = Layout

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})
