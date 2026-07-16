import Layout from '@/components/layouts/admin'
import CreateOrUpdateTypeForm from '@/components/group/group-form'
import PageHeader from '@/components/page/page-header'
import { adminOnly } from '@/utils/auth-utils'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function CreateServiceTypePage() {
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

CreateServiceTypePage.authenticate = {
  permissions: adminOnly,
}
CreateServiceTypePage.Layout = Layout

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['form', 'common'])),
  },
})
