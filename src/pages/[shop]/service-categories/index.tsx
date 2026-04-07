import Card from '@/components/common/card'
import ShopLayout from '@/components/layouts/shop'
import PageHeading from '@/components/common/page-heading'
import Search from '@/components/common/search'
import LinkButton from '@/components/ui/link-button'
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

  const shopSlug = shop as string

  return (
    <>
      <Card className="mb-8 flex flex-col">
        <div className="flex w-full flex-col items-center md:flex-row">
          <div className="mb-4 md:mb-0 md:w-1/4">
            <PageHeading title={t('common:sidebar-nav-item-service-categories')} />
          </div>

          <div className="flex w-full flex-col items-center space-y-4 ms-auto md:flex-row md:space-y-0 xl:w-3/4">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-name')}
            />

            {locale === Config.defaultLanguage && (
              <LinkButton
                href={`/${shopSlug}${Routes.serviceCategory.create}`}
                className="h-12 w-full md:w-auto md:ms-6"
              >
                <span className="block md:hidden xl:block">
                  + {t('form:button-label-add-service-categories')}
                </span>
                <span className="hidden md:block xl:hidden">
                  + {t('form:button-label-add')}
                </span>
              </LinkButton>
            )}
          </div>
        </div>
      </Card>
      <ServiceCategoryList
        serviceCategories={serviceCategories}
        paginatorInfo={paginatorInfo}
        onPagination={handlePagination}
      />
    </>
  )
}

ShopServiceCategoriesPage.authenticate = {
  permissions: adminOnly,
}
ShopServiceCategoriesPage.Layout = ShopLayout

export const getServerSideProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'table',
      'common',
      'form',
    ])),
  },
})
