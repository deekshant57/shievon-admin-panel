import Search from '@/components/common/search'
import { ArrowDown } from '@/components/icons/arrow-down'
import { ArrowUp } from '@/components/icons/arrow-up'
import ShopLayout from '@/components/layouts/shop'
import DataPanel from '@/components/page/data-panel'
import ErrorMessage from '@/components/ui/error-message'
import LinkActionButton from '@/components/ui/link-action-button'
import Loader from '@/components/ui/loader/loader'
import { Config } from '@/config'
import { Routes } from '@/config/routes'
import { useServiceOfferingsQuery } from '@/data/service-offering'
import { useShopQuery } from '@/data/shop'
import { useMeQuery } from '@/data/user'
import {
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils'
import cn from 'classnames'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import Select from '@/components/ui/select/select'
import Label from '@/components/ui/label'
import { useTypesQuery } from '@/data/type'
import { isServiceType } from '@/utils/service-type'
import ServiceList from '@/components/service/service-list'
import { Type } from '@/types'

export default function ServicesPage() {
  const router = useRouter()
  const { permissions } = getAuthCredentials()
  const { data: me, isLoading: fetchingMe } = useMeQuery()
  const {
    query: { shop },
  } = router

  const {
    data: shopData,
    isLoading: fetchingShop,
    error: shopError,
  } = useShopQuery({ slug: shop as string })
  const shopId = shopData?.id

  const { t } = useTranslation()
  const { locale } = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [type, setType] = useState<Type | null>(null)
  const [page, setPage] = useState(1)
  const [visible, setVisible] = useState(true)
  const hasRedirectedRef = useRef(false)

  const toggleVisible = () => {
    setVisible((v) => !v)
  }

  const numericShopId = shopId ? Number(shopId) : undefined

  const { types: rawTypes, loading: loadingTypes } = useTypesQuery({
    limit: 999,
    language: locale,
  })
  const serviceTypes = useMemo(
    () => (rawTypes ?? []).filter((t: any) => isServiceType(t)),
    [rawTypes],
  )

  const { serviceOfferings, paginatorInfo, loading, error } =
    useServiceOfferingsQuery(
      {
        limit: 20,
        page,
        shop_id: numericShopId as any,
        search: searchTerm,
        status: '',
      } as any,
      { enabled: Boolean(numericShopId) },
    )

  const filteredServiceOfferings = useMemo(() => {
    if (!type?.id) return serviceOfferings
    return (serviceOfferings ?? []).filter(
      (s: any) => Number(s?.typeId) === Number(type.id),
    )
  }, [serviceOfferings, type?.id])

  useEffect(() => {
    if (hasRedirectedRef.current) return
    if (fetchingShop || fetchingMe || !numericShopId || !me) return
    const hasRequiredPermission = hasAccess(adminOwnerAndStaffOnly, permissions)
    const isShopOwner = me?.shops?.some((s) => s.id === shopId) ?? false
    const isManagedShop = me?.managed_shop?.id === shopId
    if (!hasRequiredPermission && !isShopOwner && !isManagedShop) {
      hasRedirectedRef.current = true
      window.location.href = Routes.dashboard
    }
  }, [fetchingShop, fetchingMe, numericShopId, me, permissions, shopId])

  if (loading || fetchingShop || fetchingMe) {
    return <Loader text={t('common:text-loading')} />
  }
  if (error) return <ErrorMessage message={error.message} />
  if (shopError) {
    return (
      <ErrorMessage
        message={t('common:error-shop-not-found') || 'Shop not found'}
      />
    )
  }
  if (!fetchingShop && !numericShopId) {
    return (
      <ErrorMessage
        message={t('common:error-shop-not-found') || 'Shop not found'}
      />
    )
  }

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText)
    setPage(1)
  }

  function handlePagination(current: any) {
    setPage(current)
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <DataPanel
        className="mb-0"
        title={t('common:text-services') || 'Services'}
        subtitle={t('common:services-page-subtitle')}
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
                    href={`/${shop}/services/create`}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center sm:w-auto"
                  >
                    + {t('common:text-add-service') || 'Add service'}
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
              <div className="border-t border-border/60 pt-4">
                <Label>{t('common:filter-by-type') || 'Filter by type'}</Label>
                <Select
                  options={serviceTypes}
                  isLoading={loadingTypes}
                  getOptionLabel={(option: any) => option.name}
                  getOptionValue={(option: any) => option.slug}
                  placeholder={t('common:filter-by-type-placeholder')}
                  onChange={(typeOption: any) => {
                    setType(typeOption ?? null)
                    setPage(1)
                  }}
                  isClearable={true}
                />
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
  permissions: adminOwnerAndStaffOnly,
}
ServicesPage.Layout = ShopLayout

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
})
