import ShopLayout from '@/components/layouts/shop'
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
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function ShopServiceTypesPage() {
  const { locale } = useRouter()
  const router = useRouter()
  const shopSlug = router.query.shop as string
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  const { types, loading, error } = useTypesQuery({
    name: searchTerm,
    language: locale,
  })

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
        subtitle={t('common:service-types-page-subtitle')}
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
                href={`/${shopSlug}${Routes.serviceType.create}`}
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
        <TypeList types={types} routes={Routes.serviceType} />
      </DataPanel>
    </div>
  )
}

ShopServiceTypesPage.authenticate = {
  permissions: adminOnly,
}
ShopServiceTypesPage.Layout = ShopLayout

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'table',
      'common',
      'form',
    ])),
  },
})

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
}
