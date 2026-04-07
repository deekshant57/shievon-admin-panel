import ShopLayout from '@/components/layouts/shop'
import ServiceCategoryForm from '@/components/service-category/service-category-form'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { adminOnly } from '@/utils/auth-utils'

export default function CreateShopServiceCategoryPage() {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:form-title-create-service-category')}
        </h1>
      </div>
      <ServiceCategoryForm />
    </>
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
