import Card from '@/components/common/card'
import PageHeading from '@/components/common/page-heading'
import Search from '@/components/common/search'
import TypeList from '@/components/group/group-list'
import ShopLayout from '@/components/layouts/shop'
import ErrorMessage from '@/components/ui/error-message'
import LinkButton from '@/components/ui/link-button'
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
    <>
      <Card className="mb-8 flex flex-col items-center md:flex-row">
        <div className="mb-4 md:mb-0 md:w-1/4">
          <PageHeading title={t('common:sidebar-nav-item-service-types')} />
        </div>

        <div className="flex w-full flex-col items-center space-y-4 ms-auto md:flex-row md:space-y-0 xl:w-1/2">
          <Search
            onSearch={handleSearch}
            placeholderText={t('form:input-placeholder-search-name')}
          />

          {locale === Config.defaultLanguage && (
            <LinkButton
              href={`/${shopSlug}${Routes.serviceType.create}`}
              className="h-12 w-full md:w-auto md:ms-6"
            >
              <span className="block md:hidden xl:block">
                + {t('form:button-label-add-group')}
              </span>
              <span className="hidden md:block xl:hidden">
                + {t('form:button-label-add')}
              </span>
            </LinkButton>
          )}
        </div>
      </Card>
      <TypeList types={types} routes={Routes.serviceType} />
    </>
  )
}

ShopServiceTypesPage.authenticate = {
  permissions: adminOnly,
}
ShopServiceTypesPage.Layout = ShopLayout

export const getServerSideProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['table', 'common', 'form'])),
  },
})
