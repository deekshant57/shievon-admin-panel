import Layout from '@/components/layouts/admin'
import DataPanel from '@/components/page/data-panel'
import Search from '@/components/common/search'
import LinkActionButton from '@/components/ui/link-action-button'
import ErrorMessage from '@/components/ui/error-message'
import Loader from '@/components/ui/loader/loader'
import { Config } from '@/config'
import { Routes } from '@/config/routes'
import ServiceCategoryList from '@/components/service-category/service-category-list'
import { useServiceCategoriesQuery } from '@/data/service-category'
import { adminOnly } from '@/utils/auth-utils'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function ServiceCategoriesPage() {
  const { locale } = useRouter()
  const { t } = useTranslation()

  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  const { serviceCategories, paginatorInfo, loading, error } =
    useServiceCategoriesQuery({
      limit: 20,
      page,
      search: searchTerm,
    })

  if (loading) return <Loader text={t('common:text-loading')} />
  if (error) return <ErrorMessage message={error.message} />

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText)
    setPage(1)
  }

  function handlePagination(current: number) {
    setPage(current)
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <DataPanel
        className="mb-0"
        title={t('common:sidebar-nav-item-service-categories')}
        subtitle={t('common:service-categories-page-subtitle')}
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
                href={Routes.serviceCategory.create}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                + {t('form:button-label-add-service-categories')}
              </LinkActionButton>
            )}
          </div>
        }
      >
        <ServiceCategoryList
          serviceCategories={serviceCategories}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
        />
      </DataPanel>
    </div>
  )
}

ServiceCategoriesPage.authenticate = {
  permissions: adminOnly,
}
ServiceCategoriesPage.Layout = Layout

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'table',
      'common',
      'form',
    ])),
  },
})
