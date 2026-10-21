import ShopLayout from '@/components/layouts/shop'
import CreateOrUpdateServiceOfferingForm from '@/components/service/service-form'
import PageHeader from '@/components/page/page-header'
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
    <div className="space-y-6">
      <PageHeader
        title={t('common:services-create-title') || 'Create service'}
        subtitle={t('common:services-create-subtitle')}
      />
      <CreateOrUpdateServiceOfferingForm shopId={shopId} />
    </div>
  )
}

CreateServiceOfferingPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
}
CreateServiceOfferingPage.Layout = ShopLayout

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['form', 'common'])),
  },
})

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
}
