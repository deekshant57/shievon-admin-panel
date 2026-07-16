import Layout from '@/components/layouts/admin'
import DataPanel from '@/components/page/data-panel'
import Search from '@/components/common/search'
import LinkActionButton from '@/components/ui/link-action-button'
import TypeList from '@/components/group/group-list'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import { Config } from '@/config'
import { Routes } from '@/config/routes'
import { useTypesQuery } from '@/data/type'
import { adminOnly } from '@/utils/auth-utils'
import { isServiceType } from '@/utils/service-type'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

export default function ServiceTypesPage() {
  const { locale } = useRouter()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  const { types, loading, error } = useTypesQuery({
    name: searchTerm,
    language: locale,
  })

  const serviceTypes = useMemo(
    () => (types ?? []).filter((type) => isServiceType(type)),
    [types],
  )

  if (loading) return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={error.message} />

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText)
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <DataPanel
        className="mb-0"
        title={t('common:sidebar-nav-item-service-types')}
        subtitle={t('common:service-types-admin-page-subtitle')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-name')}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            {locale === Config.defaultLanguage && (
              <LinkActionButton
                href={Routes.serviceType.create}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                + {t('form:button-label-add-type')}
              </LinkActionButton>
            )}
          </div>
        }
      >
        <TypeList types={serviceTypes} routes={Routes.serviceType} />
      </DataPanel>
    </div>
  )
}

ServiceTypesPage.authenticate = {
  permissions: adminOnly,
}
ServiceTypesPage.Layout = Layout

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'table',
      'common',
      'form',
    ])),
  },
})
