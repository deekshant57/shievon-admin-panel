import CreateOrUpdateServiceOfferingForm from '@/components/service/service-form'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ShopLayout from '@/components/layouts/shop'
import PageHeader from '@/components/page/page-header'
import { adminOwnerAndStaffOnly } from '@/utils/auth-utils'
import { useServiceOfferingQuery } from '@/data/service-offering'
import { useShopQuery } from '@/data/shop'

export default function UpdateServiceOfferingPage() {
  const { query } = useRouter()
  const { t } = useTranslation()

  const { data: shopData, isLoading: fetchingShop } = useShopQuery({
    slug: query?.shop as string,
  })
  const shopId = shopData?.id ? Number(shopData.id) : undefined

  const { serviceOffering, loading, error } = useServiceOfferingQuery(
    { id: query.id as string },
    { enabled: Boolean(query.id) },
  )

  if (fetchingShop || loading) return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={error.message} />
  if (!shopId)
    return (
      <ErrorMessage
        message={t('common:error-shop-not-found') || 'Shop not found'}
      />
    )
  if (!serviceOffering)
    return <ErrorMessage message={t('Not found') || 'Not found'} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('common:services-edit-title') || 'Edit service'}
        subtitle={
          serviceOffering?.name
            ? t('common:services-edit-subtitle', {
                name: serviceOffering.name,
              })
            : t('common:services-edit-subtitle-generic')
        }
      />
      <CreateOrUpdateServiceOfferingForm
        key={serviceOffering?.id ?? 'service'}
        initialValues={serviceOffering}
        shopId={shopId}
      />
    </div>
  )
}

UpdateServiceOfferingPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
}
UpdateServiceOfferingPage.Layout = ShopLayout

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common'])),
  },
})
