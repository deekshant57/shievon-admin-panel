import Pagination from '@/components/ui/pagination';
import { Table } from '@/components/ui/table';
import { getIcon } from '@/utils/get-icon';
import * as categoriesIcon from '@/components/icons/category';
import { SortOrder } from '@/types';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { useIsRTL } from '@/utils/locals';
import { useMemo, useState } from 'react';
import TitleWithSort from '@/components/ui/title-with-sort';
import { Category, MappedPaginatorInfo } from '@/types';
import { Routes } from '@/config/routes';
import LanguageSwitcher from '@/components/ui/lang-action/action';
import { NoDataFound } from '@/components/icons/no-data-found';
import EmptyState from '@/components/page/empty-state';
import {
  ProgressiveColumnsControl,
  useProgressiveColumns,
} from '@/components/page/progressive-columns';
import { siteSettings } from '@/settings/site.settings';

const PRIMARY_COLUMN_KEYS = ['id', 'name', 'type', 'actions'];

export type IProps = {
  categories: Category[] | undefined;
  paginatorInfo: MappedPaginatorInfo | null;
  onPagination: (key: number) => void;
  onSort: (current: any) => void;
  onOrder: (current: string) => void;
};

const CategoryList = ({
  categories,
  paginatorInfo,
  onPagination,
  onSort,
  onOrder,
}: IProps) => {
  const { t } = useTranslation();
  const rowExpandable = (record: any) => record.children?.length;
  const { alignLeft, alignRight } = useIsRTL();
  const [sortingObj, setSortingObj] = useState<{
    sort: SortOrder;
    column: string | null;
  }>({
    sort: SortOrder.Desc,
    column: null,
  });

  const onHeaderClick = (column: string | null) => ({
    onClick: () => {
      onSort((currentSortDirection: SortOrder) =>
        currentSortDirection === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
      );
      onOrder(column!);

      setSortingObj({
        sort:
          sortingObj.sort === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
        column: column,
      });
    },
  });

  const allColumns = useMemo(
    () => [
      {
        title: t('table:table-item-id'),
        dataIndex: 'id',
        key: 'id',
        align: alignLeft,
        width: 90,
        render: (id: number) => (
          <span className="whitespace-nowrap text-body">#{id}</span>
        ),
      },
      {
        title: (
          <TitleWithSort
            title={t('table:table-item-title')}
            ascending={
              sortingObj.sort === SortOrder.Asc && sortingObj.column === 'name'
            }
            isActive={sortingObj.column === 'name'}
          />
        ),
        className: 'cursor-pointer',
        dataIndex: 'name',
        key: 'name',
        align: alignLeft,
        width: 260,
        onHeaderCell: () => onHeaderClick('name'),
        render: (name: string, { image }: { image: any }) => {
          return (
            <div className="flex min-w-0 items-center">
              <div className="relative aspect-square h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted/30 me-2.5">
                <Image
                  src={image?.thumbnail ?? siteSettings.product.placeholder}
                  alt={name}
                  fill
                  priority={true}
                  sizes="40px"
                />
              </div>
              <span className="truncate font-medium" title={name}>
                {name}
              </span>
            </div>
          );
        },
      },
      {
        title: t('table:table-item-details'),
        dataIndex: 'details',
        key: 'details',
        align: alignLeft,
        width: 200,
      },
      {
        title: t('table:table-item-icon'),
        dataIndex: 'icon',
        key: 'icon',
        align: 'center' as const,
        width: 88,
        render: (icon: string) => {
          if (!icon) return null;
          return (
            <span className="flex items-center justify-center">
              {getIcon({
                iconList: categoriesIcon,
                iconName: icon,
                className: 'w-5 h-5 max-h-full max-w-full',
              })}
            </span>
          );
        },
      },
      {
        title: (
          <TitleWithSort
            title={t('table:table-item-slug')}
            ascending={
              sortingObj.sort === SortOrder.Asc && sortingObj.column === 'slug'
            }
            isActive={sortingObj.column === 'slug'}
          />
        ),
        className: 'cursor-pointer',
        dataIndex: 'slug',
        key: 'slug',
        align: alignLeft,
        width: 160,
        onHeaderCell: () => onHeaderClick('slug'),
      },
      {
        title: t('table:table-item-group'),
        dataIndex: 'type',
        key: 'type',
        align: 'center' as const,
        width: 140,
        render: (type: any) => (
          <span className="truncate" title={type?.name}>
            {type?.name}
          </span>
        ),
      },
      {
        title: t('table:table-item-actions'),
        dataIndex: 'slug',
        key: 'actions',
        align: alignRight,
        width: 120,
        render: (slug: string, record: Category) => (
          <LanguageSwitcher
            slug={slug}
            record={record}
            deleteModalView="DELETE_CATEGORY"
            routes={Routes?.category}
          />
        ),
      },
    ],
    [alignLeft, alignRight, sortingObj.column, sortingObj.sort, t],
  );

  const secondaryOptions = useMemo(
    () => [
      { key: 'details', label: t('table:table-item-details') },
      { key: 'icon', label: t('table:table-item-icon') },
      { key: 'slug', label: t('table:table-item-slug') },
    ],
    [t],
  );

  const {
    visibleColumns,
    visibleSecondaryKeys,
    toggleSecondary,
    showAllSecondary,
    resetSecondary,
  } = useProgressiveColumns({
    columns: allColumns,
    primaryKeys: PRIMARY_COLUMN_KEYS,
    secondaryOptions,
  });

  return (
    <>
      <div className="border-b border-border/60 py-3">
        <ProgressiveColumnsControl
          options={secondaryOptions}
          visibleKeys={visibleSecondaryKeys}
          onToggle={toggleSecondary}
          onShowAll={showAllSecondary}
          onReset={resetSecondary}
        />
      </div>

      <Table
        //@ts-ignore
        columns={visibleColumns}
        emptyText={() => (
          <EmptyState
            icon={<NoDataFound className="w-40" />}
            title={t('table:empty-table-data')}
            description={t('table:empty-table-sorry-text')}
          />
        )}
        data={categories}
        rowKey="id"
        expandable={{
          expandedRowRender: () => ' ',
          rowExpandable: rowExpandable,
        }}
      />

      {!!paginatorInfo?.total && (
        <div className="mt-6 flex items-center justify-end">
          <Pagination
            total={paginatorInfo.total}
            current={paginatorInfo.currentPage}
            pageSize={paginatorInfo.perPage}
            onChange={onPagination}
          />
        </div>
      )}
    </>
  );
};

export default CategoryList;
