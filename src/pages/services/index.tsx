import Search from '@/components/common/search'
import { ArrowDown } from '@/components/icons/arrow-down'
import { ArrowUp } from '@/components/icons/arrow-up'
import Layout from '@/components/layouts/admin'
import DataPanel from '@/components/page/data-panel'
import ErrorMessage from '@/components/ui/error-message'
import LinkActionButton from '@/components/ui/link-action-button'
import Loader from '@/components/ui/loader/loader'
import Select from '@/components/ui/select/select'
import Label from '@/components/ui/label'
import { Config } from '@/config'
import { Routes } from '@/config/routes'
import { useServiceOfferingsQuery } from '@/data/service-offering'
import { useShopsQuery } from '@/data/shop'
import { useTypesQuery } from '@/data/type'
import { Shop, Type } from '@/types'
import { adminOnly } from '@/utils/auth-utils'
import { isServiceType } from '@/utils/service-type'
import cn from 'classnames'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import ServiceList from '@/components/service/service-list'

export default function ServicesPage() {
  const { locale } = useRouter()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [type, setType] = useState<Type | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [page, setPage] = useState(1)
  const [visible, setVisible] = useState(true)

  const toggleVisible = () => {
    setVisible((value) => !value)
  }

  const { shops, loading: loadingShops } = useShopsQuery({
    is_active: true,
    limit: 200,
  })

  const numericShopId = shop?.id ? Number(shop.id) : undefined

  const { types: rawTypes, loading: loadingTypes } = useTypesQuery({
    limit: 999,
    language: locale,
  })
  const serviceTypes = useMemo(
    () => (rawTypes ?? []).filter((item) => isServiceType(item)),
    [rawTypes],
  )

  const { serviceOfferings, paginatorInfo, loading, error } =
    useServiceOfferingsQuery({
      limit: 20,
      page,
      shop_id: numericShopId as any,
      search: searchTerm,
      status: '',
    })

  const filteredServiceOfferings = useMemo(() => {
    if (!type?.id) return serviceOfferings
    return (serviceOfferings ?? []).filter(
      (service) => Number(service?.typeId) === Number(type.id),
    )
  }, [serviceOfferings, type?.id])

  if (loading || loadingShops) return <Loader text={t('common:text-loading')} />
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
        title={t('common:text-services')}
        subtitle={t('common:services-admin-page-subtitle')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Search
                onSearch={handleSearch}
                placeholderText={t('form:input-placeholder-search-name')}
                debounceMs={400}
                variant="hybrid"
                size="sm"
                className="w-full min-w-0 sm:flex-1"
              />
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                {locale === Config.defaultLanguage && (
                  <LinkActionButton
                    href={Routes.serviceOffering.create}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center sm:w-auto"
                  >
                    + {t('common:text-add-service')}
                  </LinkActionButton>
                )}
                <button
                  type="button"
                  className="flex items-center justify-center whitespace-nowrap text-sm font-semibold text-accent"
                  onClick={toggleVisible}
                >
                  {t('common:text-filter')}{' '}
                  {visible ? (
                    <ArrowUp className="ms-2" />
                  ) : (
                    <ArrowDown className="ms-2" />
                  )}
                </button>
              </div>
            </div>

            <div
              className={cn('w-full transition', {
                'visible h-auto': visible,
                'invisible h-0 overflow-hidden': !visible,
              })}
            >
              <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
                <div>
                  <Label>{t('common:filter-by-shop') || 'Filter by shop'}</Label>
                  <Select
                    options={shops}
                    isLoading={loadingShops}
                    getOptionLabel={(option: Shop) => option.name}
                    getOptionValue={(option: Shop) => option.slug}
                    placeholder={t('common:filter-by-shop-placeholder')}
                    onChange={(shopOption: Shop | null) => {
                      setShop(shopOption ?? null)
                      setPage(1)
                    }}
                    isClearable={true}
                  />
                </div>
                <div>
                  <Label>{t('common:filter-by-type') || 'Filter by type'}</Label>
                  <Select
                    options={serviceTypes}
                    isLoading={loadingTypes}
                    getOptionLabel={(option: Type) => option.name}
                    getOptionValue={(option: Type) => option.slug}
                    placeholder={t('common:filter-by-type-placeholder')}
                    onChange={(typeOption: Type | null) => {
                      setType(typeOption ?? null)
                      setPage(1)
                    }}
                    isClearable={true}
                  />
                </div>
              </div>
            </div>
          </div>
        }
      >
        <ServiceList
          serviceOfferings={filteredServiceOfferings}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={() => {}}
          onSort={() => {}}
        />
      </DataPanel>
    </div>
  )
}

ServicesPage.authenticate = {
  permissions: adminOnly,
}
ServicesPage.Layout = Layout

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'table',
      'common',
      'form',
    ])),
  },
})
