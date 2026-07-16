import Layout from '@/components/layouts/admin'
import CreateOrUpdateServiceOfferingForm from '@/components/service/service-form'
import PageHeader from '@/components/page/page-header'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import Label from '@/components/ui/label'
import Select from '@/components/ui/select/select'
import { useShopsQuery } from '@/data/shop'
import { Shop } from '@/types'
import { adminOnly } from '@/utils/auth-utils'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'

export default function CreateServiceOfferingPage() {
  const { t } = useTranslation()
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)

  const { shops, loading, error } = useShopsQuery({
    is_active: true,
    limit: 200,
  })

  const shopId = selectedShop?.id ? Number(selectedShop.id) : undefined

  if (loading) return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('common:services-create-title') || 'Create service'}
        subtitle={t('common:services-admin-create-subtitle')}
      />

      <div className="max-w-md">
        <Label>{t('common:text-select-shop') || 'Select shop'}</Label>
        <Select
          options={shops}
          isLoading={loading}
          getOptionLabel={(option: Shop) => option.name}
          getOptionValue={(option: Shop) => option.slug}
          placeholder={t('common:text-select-shop-placeholder')}
          onChange={(shopOption: Shop | null) => {
            setSelectedShop(shopOption ?? null)
          }}
        />
      </div>

      {shopId ? (
        <CreateOrUpdateServiceOfferingForm shopId={shopId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('common:services-select-shop-prompt')}
        </p>
      )}
    </div>
  )
}

CreateServiceOfferingPage.authenticate = {
  permissions: adminOnly,
}
CreateServiceOfferingPage.Layout = Layout

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})
