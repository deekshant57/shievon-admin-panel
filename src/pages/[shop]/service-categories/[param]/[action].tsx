import ShopLayout from '@/components/layouts/shop'
import ServiceCategoryForm from '@/components/service-category/service-category-form'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import { useServiceCategoryQuery } from '@/data/service-category'
import { adminOnly } from '@/utils/auth-utils'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'

export default function EditShopServiceCategoryPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const param = router.query.param as string | undefined
  const isEdit = router.query.action === 'edit'

  const { serviceCategory, isLoading, error } = useServiceCategoryQuery({
    param,
    enabled: Boolean(param) && isEdit,
  })

  if (!param || isLoading)
    return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={error.message} />
  if (isEdit && serviceCategory == null)
    return <Loader text={t('common:text-loading')} />

  return (
    <>
      <div className="flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:form-title-edit-service-category')}
        </h1>
      </div>
      <ServiceCategoryForm initialValues={serviceCategory ?? undefined} />
    </>
  )
}

EditShopServiceCategoryPage.authenticate = {
  permissions: adminOnly,
}
EditShopServiceCategoryPage.Layout = ShopLayout

export const getServerSideProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})
