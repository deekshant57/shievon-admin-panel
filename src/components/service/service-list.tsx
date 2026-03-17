import Pagination from '@/components/ui/pagination'
import Image from 'next/image'
import { Table } from '@/components/ui/table'
import { siteSettings } from '@/settings/site.settings'
import usePrice from '@/utils/use-price'
import Badge from '@/components/ui/badge/badge'
import { useTranslation } from 'next-i18next'
import { NoDataFound } from '@/components/icons/no-data-found'
import { Routes } from '@/config/routes'
import { useIsRTL } from '@/utils/locals'
import { useRouter } from 'next/router'
import { useState } from 'react'
import TitleWithSort from '@/components/ui/title-with-sort'
import { SortOrder } from '@/types'
import type { MappedPaginatorInfo, ServiceOffering } from '@/types'
import ActionButtons from '@/components/common/action-buttons'

export type ServiceListProps = {
  serviceOfferings: ServiceOffering[] | undefined
  paginatorInfo: MappedPaginatorInfo | null
  onPagination: (current: number) => void
  onSort: (current: any) => void
  onOrder: (current: string) => void
}

type SortingObjType = {
  sort: SortOrder
  column: string | null
}

function PriceCell({ record }: { record: ServiceOffering }) {
  const baseAmount =
    typeof record?.basePrice === 'string'
      ? Number(record.basePrice)
      : (record?.basePrice ?? undefined)
  const saleAmount =
    typeof record?.salePrice === 'string'
      ? Number(record.salePrice)
      : (record?.salePrice ?? undefined)

  const { price: base } = usePrice({ amount: baseAmount as number })
  const { price: sale } = usePrice({ amount: saleAmount as number })

  return (
    <div className="flex flex-col items-end">
      <span className="whitespace-nowrap">{saleAmount ? sale : base}</span>
      {saleAmount ? (
        <span className="whitespace-nowrap text-xs text-body/70 line-through">
          {base}
        </span>
      ) : null}
    </div>
  )
}

const ServiceList = ({
  serviceOfferings,
  paginatorInfo,
  onPagination,
  onSort,
  onOrder,
}: ServiceListProps) => {
  const router = useRouter()
  const {
    query: { shop },
  } = router
  const { t } = useTranslation()
  const { alignLeft, alignRight } = useIsRTL()

  const [sortingObj, setSortingObj] = useState<SortingObjType>({
    sort: SortOrder.Desc,
    column: null,
  })

  const onHeaderClick = (column: string | null) => ({
    onClick: () => {
      onSort((currentSortDirection: SortOrder) =>
        currentSortDirection === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
      )
      onOrder(column!)
      setSortingObj({
        sort: sortingObj.sort === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
        column,
      })
    },
  })

  const columns = [
    {
      title: t('table:table-item-id'),
      dataIndex: 'id',
      key: 'id',
      align: alignLeft,
      width: 180,
      render: (id: string) => `#${t('table:table-item-id')}: ${id}`,
    },
    {
      title: (
        <TitleWithSort
          title={t('table:table-item-product') || 'Service'}
          ascending={sortingObj.sort === SortOrder.Asc && sortingObj.column === 'name'}
          isActive={sortingObj.column === 'name'}
        />
      ),
      className: 'cursor-pointer',
      dataIndex: 'name',
      key: 'name',
      align: alignLeft,
      width: 320,
      ellipsis: true,
      onHeaderCell: () => onHeaderClick('name'),
      render: (name: string, record: ServiceOffering) => (
        <div className="flex items-center">
          <div className="relative aspect-square h-10 w-10 shrink-0 overflow-hidden rounded border border-border-200/80 bg-gray-100 me-2.5">
            <Image
              src={
                (record as any)?.image?.thumbnail ??
                (record as any)?.image?.original ??
                siteSettings.product.placeholder
              }
              alt={name}
              fill
              priority={true}
              sizes="(max-width: 768px) 100vw"
            />
          </div>
          <div className="flex flex-col">
            <span className="truncate font-medium">{name}</span>
            <span className="truncate whitespace-nowrap pt-1 pb-0.5 text-[13px] text-body/80">
              {(record as any)?.type?.name ?? ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: t('table:table-item-unit') || 'Price',
      dataIndex: 'basePrice',
      key: 'basePrice',
      align: alignRight,
      width: 160,
      render: (_: unknown, record: ServiceOffering) => <PriceCell record={record} />,
    },
    {
      title: t('Duration') || 'Duration',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      align: alignLeft,
      width: 140,
      render: (durationMinutes: number | undefined) =>
        durationMinutes != null ? `${durationMinutes} min` : '-',
    },
    {
      title: t('table:table-item-status'),
      dataIndex: 'status',
      key: 'status',
      align: alignLeft,
      width: 180,
      render: (status: string) => (
        <Badge
          text={status ?? 'active'}
          color={
            String(status ?? '')
              .toLowerCase()
              .includes('draft')
              ? 'bg-yellow-400/10 text-yellow-500'
              : 'bg-accent bg-opacity-10 !text-accent'
          }
          className="capitalize"
        />
      ),
    },
    {
      title: t('table:table-item-actions'),
      dataIndex: 'id',
      key: 'actions',
      align: alignRight,
      width: 120,
      render: (id: string) => (
        <ActionButtons
          id={id}
          editUrl={Routes.serviceOffering.editByIdWithoutLang(id, shop as string)}
          deleteModalView="DELETE_SERVICE_OFFERING"
          enablePreviewMode={false}
        />
      ),
    },
  ]

  return (
    <>
      <div className="mb-6 overflow-hidden rounded shadow">
        <Table
          //@ts-ignore
          columns={columns}
          emptyText={() => (
            <div className="flex flex-col items-center py-7">
              <NoDataFound className="w-52" />
              <div className="mb-1 pt-6 text-base font-semibold text-heading">
                {t('table:empty-table-data')}
              </div>
              <p className="text-[13px]">{t('table:empty-table-sorry-text')}</p>
            </div>
          )}
          data={serviceOfferings}
          rowKey="id"
          scroll={{ x: 900 }}
        />
      </div>

      {!!paginatorInfo?.total && (
        <div className="flex items-center justify-end">
          <Pagination
            total={paginatorInfo.total}
            current={paginatorInfo.currentPage}
            pageSize={paginatorInfo.perPage}
            onChange={onPagination}
            showLessItems
          />
        </div>
      )}
    </>
  )
}

export default ServiceList

