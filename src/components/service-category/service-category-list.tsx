import Pagination from '@/components/ui/pagination'
import { Table } from '@/components/ui/table'
import { useTranslation } from 'next-i18next'
import { useIsRTL } from '@/utils/locals'
import type { MappedPaginatorInfo, ServiceCategory } from '@/types'
import { Routes } from '@/config/routes'
import LanguageSwitcher from '@/components/ui/lang-action/action'
import { NoDataFound } from '@/components/icons/no-data-found'

export type ServiceCategoryListProps = {
  serviceCategories: ServiceCategory[] | undefined
  paginatorInfo: MappedPaginatorInfo | null
  onPagination: (page: number) => void
}

const ServiceCategoryList = ({
  serviceCategories,
  paginatorInfo,
  onPagination,
}: ServiceCategoryListProps) => {
  const { t } = useTranslation()
  const { alignLeft, alignRight } = useIsRTL()

  const columns = [
    {
      title: t('table:table-item-id'),
      dataIndex: 'id',
      key: 'id',
      align: alignLeft,
      width: 100,
      render: (id: number) => `#${id}`,
    },
    {
      title: t('table:table-item-title'),
      dataIndex: 'name',
      key: 'name',
      align: alignLeft,
      width: 200,
      render: (name: string) => (
        <span className="truncate font-medium">{name}</span>
      ),
    },
    {
      title: t('table:table-item-slug'),
      dataIndex: 'slug',
      key: 'slug',
      align: alignLeft,
      width: 160,
      render: (slug: string | null | undefined) => slug || '—',
    },
    {
      title: t('form:input-label-parent-category'),
      dataIndex: 'parent',
      key: 'parent',
      align: alignLeft,
      width: 160,
      render: (parent: ServiceCategory | null | undefined) =>
        parent?.name ?? '—',
    },
    {
      title: 'Sort',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      align: 'center',
      width: 80,
      render: (sortOrder: number | null | undefined) =>
        Number.isFinite(sortOrder) ? sortOrder : '—',
    },
    {
      title: t('common:text-status'),
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      width: 100,
      render: (isActive: boolean | undefined) =>
        isActive ? t('common:text-active') : t('common:text-inactive'),
    },
    {
      title: t('table:table-item-actions'),
      dataIndex: 'id',
      key: 'actions',
      align: alignRight,
      width: 120,
      render: (_id: number, record: ServiceCategory) => (
        <LanguageSwitcher
          slug={String(record.slug ?? record.id)}
          record={record}
          deleteModalView="DELETE_SERVICE_CATEGORY"
          routes={Routes.serviceCategory}
        />
      ),
    },
  ]

  return (
    <>
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
          data={serviceCategories}
          rowKey="id"
          scroll={{ x: 900 }}
        />

      {!!paginatorInfo?.total && (
        <div className="flex items-center justify-end">
          <Pagination
            total={paginatorInfo.total}
            current={paginatorInfo.currentPage}
            pageSize={paginatorInfo.perPage}
            onChange={onPagination}
          />
        </div>
      )}
    </>
  )
}

export default ServiceCategoryList
