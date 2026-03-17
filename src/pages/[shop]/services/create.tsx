import ShopLayout from '@/components/layouts/shop'
import CreateOrUpdateServiceOfferingForm from '@/components/service/service-form'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { adminOwnerAndStaffOnly } from '@/utils/auth-utils'
import { useShopQuery } from '@/data/shop'
import { useRouter } from 'next/router'
import Loader from '@/components/ui/loader/loader'
import ErrorMessage from '@/components/ui/error-message'

export default function CreateServiceOfferingPage() {
  const { t } = useTranslation()
  const { query } = useRouter()
  const { data: shopData, isLoading, error } = useShopQuery({
    slug: query.shop as string,
  })

  const shopId = shopData?.id ? Number(shopData.id) : undefined

  if (isLoading) return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={(error as any)?.message ?? 'Error'} />
  if (!shopId) return <ErrorMessage message={t('common:error-shop-not-found') || 'Shop not found'} />

  return (
    <>
      <div className="flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('Create service') || 'Create service'}
        </h1>
      </div>
      <CreateOrUpdateServiceOfferingForm shopId={shopId} />
    </>
  )
}

CreateServiceOfferingPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
}
CreateServiceOfferingPage.Layout = ShopLayout

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common'])),
  },
})

