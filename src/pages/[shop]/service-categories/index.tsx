import ShopLayout from '@/components/layouts/shop'
import DataPanel from '@/components/page/data-panel'
import Search from '@/components/common/search'
import ServiceabilityFilter, {
  ServiceabilityFilterOption,
} from '@/components/filters/serviceability-filter'
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

export default function ShopServiceCategoriesPage() {
  const router = useRouter()
  const { shop } = router.query
  const { t } = useTranslation()
  const { locale } = router

  const [searchTerm, setSearchTerm] = useState('')
  const [isServiceable, setIsServiceable] = useState<boolean | undefined>()
  const [page, setPage] = useState(1)

  const { serviceCategories, paginatorInfo, loading, error } =
    useServiceCategoriesQuery({
      limit: 20,
      page,
      search: searchTerm,
      is_serviceable: isServiceable,
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

  const shopSlug = shop as string

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
            <ServiceabilityFilter
              className="w-full shrink-0 sm:w-52"
              onServiceabilityFilter={(
                option: ServiceabilityFilterOption | null,
              ) => {
                setIsServiceable(option?.value)
                setPage(1)
              }}
            />
            {locale === Config.defaultLanguage && (
              <LinkActionButton
                href={`/${shopSlug}${Routes.serviceCategory.create}`}
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

ShopServiceCategoriesPage.authenticate = {
  permissions: adminOnly,
}
ShopServiceCategoriesPage.Layout = ShopLayout

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
