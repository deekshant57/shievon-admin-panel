import CreateOrUpdateTypeForm from '@/components/group/group-form'
import ShopLayout from '@/components/layouts/shop'
import PageHeader from '@/components/page/page-header'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { adminOnly } from '@/utils/auth-utils'

export default function CreateShopServiceTypePage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form:form-title-create-type')}
        subtitle={t('common:service-types-create-subtitle')}
      />
      <CreateOrUpdateTypeForm />
    </div>
  )
}

CreateShopServiceTypePage.authenticate = {
  permissions: adminOnly,
}
CreateShopServiceTypePage.Layout = ShopLayout

export const getServerSideProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})
