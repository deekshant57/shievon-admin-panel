import CreateOrUpdateServiceOfferingForm from '@/components/service/service-form'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ShopLayout from '@/components/layouts/shop'
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
    <>
      <div className="flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('Edit service') || 'Edit service'}
        </h1>
      </div>
      <CreateOrUpdateServiceOfferingForm
        key={serviceOffering?.id ?? 'service'}
        initialValues={serviceOffering}
        shopId={shopId}
      />
    </>
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

