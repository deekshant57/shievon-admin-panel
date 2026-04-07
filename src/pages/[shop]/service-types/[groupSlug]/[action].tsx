import CreateOrUpdateTypeForm from '@/components/group/group-form'
import ShopLayout from '@/components/layouts/shop'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import { Config } from '@/config'
import { useTypeQuery } from '@/data/type'
import { adminOnly } from '@/utils/auth-utils'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'

export default function UpdateShopServiceTypePage() {
  const { query, locale } = useRouter()
  const { t } = useTranslation()
  const slug = query.groupSlug as string | undefined
  const isEdit = query.action === 'edit'
  const {
    data,
    isLoading: loading,
    error,
  } = useTypeQuery({
    slug: slug ?? '',
    language: isEdit ? (locale ?? Config.defaultLanguage) : Config.defaultLanguage,
    enabled: !!slug,
  })

  if (!slug || loading) return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={error.message} />
  if (isEdit && data == null)
    return <Loader text={t('common:text-loading')} />

  return (
    <>
      <div className="flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:form-title-edit-type')}
        </h1>
      </div>
      <CreateOrUpdateTypeForm initialValues={data ?? undefined} />
    </>
  )
}

UpdateShopServiceTypePage.authenticate = {
  permissions: adminOnly,
}
UpdateShopServiceTypePage.Layout = ShopLayout

export const getServerSideProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})
