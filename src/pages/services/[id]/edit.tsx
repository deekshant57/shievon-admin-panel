import Layout from '@/components/layouts/admin'
import CreateOrUpdateServiceOfferingForm from '@/components/service/service-form'
import PageHeader from '@/components/page/page-header'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import { useServiceOfferingQuery } from '@/data/service-offering'
import { adminOnly } from '@/utils/auth-utils'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'

export default function UpdateServiceOfferingPage() {
  const { query } = useRouter()
  const { t } = useTranslation()

  const { serviceOffering, loading, error } = useServiceOfferingQuery(
    { id: query.id as string },
    { enabled: Boolean(query.id) },
  )

  const shopId =
    serviceOffering?.shopId != null
      ? Number(serviceOffering.shopId)
      : serviceOffering?.shop?.id != null
        ? Number(serviceOffering.shop.id)
        : undefined

  if (loading) return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={error.message} />
  if (!serviceOffering) {
    return <ErrorMessage message={t('common:text-not-found') || 'Not found'} />
  }
  if (!shopId) {
    return (
      <ErrorMessage
        message={t('common:error-shop-not-found') || 'Shop not found'}
      />
    )
  }

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
  permissions: adminOnly,
}
UpdateServiceOfferingPage.Layout = Layout

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})

export async function getStaticPaths() {
  return { paths: [{ params: {"id":"__gh"} }], fallback: false };
}
