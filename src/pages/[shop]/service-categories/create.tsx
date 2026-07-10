import ShopLayout from '@/components/layouts/shop'
import ServiceCategoryForm from '@/components/service-category/service-category-form'
import PageHeader from '@/components/page/page-header'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { adminOnly } from '@/utils/auth-utils'

export default function CreateShopServiceCategoryPage() {
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

CreateShopServiceCategoryPage.authenticate = {
  permissions: adminOnly,
}
CreateShopServiceCategoryPage.Layout = ShopLayout

export const getServerSideProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})
