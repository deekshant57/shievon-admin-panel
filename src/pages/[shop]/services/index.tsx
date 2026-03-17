import Card from '@/components/common/card'
import Search from '@/components/common/search'
import { ArrowDown } from '@/components/icons/arrow-down'
import { ArrowUp } from '@/components/icons/arrow-up'
import ShopLayout from '@/components/layouts/shop'
import ErrorMessage from '@/components/ui/error-message'
import LinkButton from '@/components/ui/link-button'
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
import PageHeading from '@/components/common/page-heading'
import Select from '@/components/ui/select/select'
import Label from '@/components/ui/label'
import { useTypesQuery } from '@/data/type'
import { isServiceType } from '@/utils/service-type'
import ServiceList from '@/components/service/service-list'
import { SortOrder, Type } from '@/types'

interface TypeOption {
  name: string
  slug: string
}

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
    return (serviceOfferings ?? []).filter((s: any) => Number(s?.typeId) === Number(type.id))
  }, [serviceOfferings, type?.id])

  // Permission/ownership check (mirrors products page)
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
    <>
      <Card className="mb-8 flex flex-col">
        <div className="flex w-full flex-col items-center md:flex-row">
          <div className="mb-4 md:mb-0 md:w-1/4">
            <PageHeading title={t('Services') || 'Services'} />
          </div>

          <div className="flex w-full flex-col items-center md:w-3/4 md:flex-row">
            <div className="flex w-full items-center">
              <Search
                onSearch={handleSearch}
                placeholderText={t('form:input-placeholder-search-name')}
              />

              {locale === Config.defaultLanguage && (
                <LinkButton href={`/${shop}/services/create`} className="h-12 ms-4 md:ms-6">
                  <span className="hidden md:block">
                    + {t('Add service') || 'Add service'}
                  </span>
                  <span className="md:hidden">+ {t('form:button-label-add') || 'Add'}</span>
                </LinkButton>
              )}
            </div>

            <button
              className="mt-5 flex items-center whitespace-nowrap text-base font-semibold text-accent md:mt-0 md:ms-5"
              onClick={toggleVisible}
            >
              {t('common:text-filter')}{' '}
              {visible ? <ArrowUp className="ms-2" /> : <ArrowDown className="ms-2" />}
            </button>
          </div>
        </div>

        <div
          className={cn('flex w-full transition', {
            'visible h-auto': visible,
            'invisible h-0': !visible,
          })}
        >
          <div className="mt-5 flex w-full flex-col border-t border-gray-200 pt-5 md:mt-8 md:flex-row md:items-center md:pt-8">
            <div className="w-full">
              <Label>{t('common:filter-by-group') || 'Filter by group'}</Label>
              <Select
                options={serviceTypes}
                isLoading={loadingTypes}
                getOptionLabel={(option: any) => option.name}
                getOptionValue={(option: any) => option.slug}
                placeholder={t('common:filter-by-group-placeholder')}
                onChange={(typeOption: any) => {
                  setType(typeOption ?? null)
                  setPage(1)
                }}
                isClearable={true}
              />
            </div>
          </div>
        </div>
      </Card>

      <ServiceList
        serviceOfferings={filteredServiceOfferings}
        paginatorInfo={paginatorInfo}
        onPagination={handlePagination}
        onOrder={() => {}}
        onSort={() => {}}
      />
    </>
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

