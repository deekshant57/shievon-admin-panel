import ActionButtons from '@/components/common/action-buttons';
import Avatar from '@/components/common/avatar';
import { NoDataFound } from '@/components/icons/no-data-found';
import EmptyState from '@/components/page/empty-state';
import {
  ProgressiveColumnsControl,
  useProgressiveColumns,
} from '@/components/page/progressive-columns';
import Badge from '@/components/ui/badge/badge';
import Link from '@/components/ui/link';
import Pagination from '@/components/ui/pagination';
import { AlignType, Table } from '@/components/ui/table';
import TitleWithSort from '@/components/ui/title-with-sort';
import { siteSettings } from '@/settings/site.settings';
import {
  MappedPaginatorInfo,
  OwnerShipTransferStatus,
  Shop,
  SortOrder,
} from '@/types';
import { OWNERSHIP_TRANSFER_STATUS } from '@/utils/constants';
import { useIsRTL } from '@/utils/locals';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { getAuthCredentials } from '@/utils/auth-utils';
import { SUPER_ADMIN } from '@/utils/constants';
import NotificationActionButton from '@/components/notify-logs/notification-action-button';

const PRIMARY_COLUMN_KEYS = ['id', 'name', 'is_active', 'actions'];

type IProps = {
  shops: Shop[] | undefined;
  paginatorInfo: MappedPaginatorInfo | null;
  onPagination: (current: number) => void;
  onSort: (current: any) => void;
  onOrder: (current: string) => void;
  isMultiCommissionRate?: boolean;
};

const ShopList = ({
  shops,
  paginatorInfo,
  onPagination,
  onSort,
  onOrder,
  isMultiCommissionRate,
}: IProps) => {
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();
  const { permissions } = getAuthCredentials();
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
        currentSortDirection === SortOrder.Desc
          ? SortOrder.Asc
          : SortOrder.Desc,
      );
      onOrder(column!);

      setSortingObj({
        sort:
          sortingObj.sort === SortOrder.Desc ? SortOrder.Asc : SortOrder.Desc,
        column: column,
      });
    },
  });

  const allColumns = useMemo(() => {
    let next = [
      {
        title: t('table:table-item-id'),
        dataIndex: 'id',
        key: 'id',
        align: alignLeft as AlignType,
        width: 100,
        render: (id: number) => `#${t('table:table-item-id')}: ${id}`,
      },
      {
        title: (
          <TitleWithSort
            title={t('table:table-item-shop')}
            ascending={
              sortingObj.sort === SortOrder.Asc && sortingObj.column === 'name'
            }
            isActive={sortingObj.column === 'name'}
          />
        ),
        dataIndex: 'name',
        key: 'name',
        align: alignLeft as AlignType,
        width: 260,
        className: 'cursor-pointer',
        onHeaderCell: () => onHeaderClick('name'),
        render: (name: any, { slug, logo }: any) => (
          <div className="flex min-w-0 items-center">
            <div className="relative aspect-square h-10 w-10 shrink-0 overflow-hidden rounded border border-border-200/80 bg-gray-100 me-2.5">
              <Image
                src={logo?.thumbnail ?? siteSettings?.product?.placeholder}
                alt={name}
                fill
                priority={true}
                sizes="40px"
              />
            </div>
            <Link href={`/${slug}`}>
              <span className="truncate font-medium" title={name}>
                {name}
              </span>
            </Link>
          </div>
        ),
      },
      {
        title: (
          <TitleWithSort
            title={t('table:table-item-total-products')}
            ascending={
              sortingObj.sort === SortOrder.Asc &&
              sortingObj.column === 'products_count'
            }
            isActive={sortingObj.column === 'products_count'}
          />
        ),
        className: 'cursor-pointer',
        dataIndex: 'products_count',
        key: 'products_count',
        align: 'center' as AlignType,
        width: 120,
        onHeaderCell: () => onHeaderClick('products_count'),
      },
      {
        title: (
          <TitleWithSort
            title={t('table:table-item-total-orders')}
            ascending={
              sortingObj.sort === SortOrder.Asc &&
              sortingObj.column === 'orders_count'
            }
            isActive={sortingObj.column === 'orders_count'}
          />
        ),
        className: 'cursor-pointer',
        dataIndex: 'orders_count',
        key: 'orders_count',
        align: 'center' as AlignType,
        onHeaderCell: () => onHeaderClick('orders_count'),
        width: 120,
      },
      {
        title: t('table:table-item-owner-name'),
        dataIndex: 'owner',
        key: 'owner',
        align: alignLeft as AlignType,
        width: 200,
        render: (owner: any) => (
          <div className="flex min-w-0 items-center">
            <Avatar
              name={owner?.name}
              src={owner?.profile?.avatar?.thumbnail}
            />
            <span className="truncate font-medium ms-2" title={owner?.name}>
              {owner?.name}
            </span>
          </div>
        ),
      },
      {
        title: (
          <TitleWithSort
            title={t('table:table-item-status')}
            ascending={
              sortingObj.sort === SortOrder.Asc &&
              sortingObj.column === 'is_active'
            }
            isActive={sortingObj.column === 'is_active'}
          />
        ),
        className: 'cursor-pointer',
        dataIndex: 'is_active',
        key: 'is_active',
        align: 'center' as AlignType,
        width: 120,
        onHeaderCell: () => onHeaderClick('is_active'),
        render: (is_active: boolean) => (
          <Badge
            textKey={is_active ? 'common:text-active' : 'common:text-inactive'}
            color={
              is_active
                ? 'bg-accent/10 !text-accent'
                : 'bg-status-failed/10 text-status-failed'
            }
          />
        ),
      },
      {
        title: t('text-quote-title'),
        key: 'settings',
        align: 'center' as AlignType,
        width: 80,
        render: (id: string, { settings, is_active }: Shop) => {
          return Boolean(settings?.askForAQuote?.enable) &&
            !Boolean(is_active) &&
            Boolean(isMultiCommissionRate) ? (
            <Badge
              textKey={settings?.askForAQuote?.quote}
              color="bg-accent/10 text-accent"
            />
          ) : (
            ''
          );
        },
      },
      {
        title: t('table:table-item-actions'),
        dataIndex: 'id',
        key: 'actions',
        align: alignRight as AlignType,
        width: 180,
        render: (id: string, shopRecord: Shop) => {
          const {
            slug,
            is_active,
            owner_id,
            ownership_history,
            settings,
            name,
            notification_action,
          } = shopRecord;
          return (
            <div className="flex flex-col items-end gap-1.5">
              <NotificationActionButton
                notificationAction={notification_action}
                entityName={name}
                className="max-w-[150px]"
              />
              <ActionButtons
                id={id}
                approveButton={true}
                detailsUrl={`/${slug}`}
                isShopActive={is_active}
                transferShopOwnership
                disabled={
                  !Boolean(is_active) ||
                  OWNERSHIP_TRANSFER_STATUS?.includes(
                    ownership_history?.status as OwnerShipTransferStatus,
                  )
                }
                data={{
                  ...settings?.askForAQuote,
                  multiCommission: Boolean(isMultiCommissionRate),
                  id,
                  owner_id: owner_id as number,
                }}
              />
            </div>
          );
        },
      },
    ];

    if (!Boolean(isMultiCommissionRate)) {
      next = next.filter((column) => column.key !== 'settings');
    }

    if (!permissions?.includes(SUPER_ADMIN)) {
      next = next.filter((column) => column.key !== 'actions');
    }

    return next;
  }, [
    alignLeft,
    alignRight,
    isMultiCommissionRate,
    permissions,
    sortingObj.column,
    sortingObj.sort,
    t,
  ]);

  const secondaryOptions = useMemo(() => {
    const options = [
      { key: 'products_count', label: t('table:table-item-total-products') },
      { key: 'orders_count', label: t('table:table-item-total-orders') },
      { key: 'owner', label: t('table:table-item-owner-name') },
    ];
    if (Boolean(isMultiCommissionRate)) {
      options.push({ key: 'settings', label: t('text-quote-title') });
    }
    return options;
  }, [isMultiCommissionRate, t]);

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
        columns={visibleColumns}
        emptyText={() => (
          <EmptyState
            icon={<NoDataFound className="w-40" />}
            title={t('table:empty-table-data')}
            description={t('table:empty-table-sorry-text')}
          />
        )}
        data={shops}
        rowKey="id"
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

export default ShopList;
