import ActionButton from '@/components/ui/action-button';
import Checkbox from '@/components/ui/checkbox/checkbox';
import Pagination from '@/components/ui/pagination';
import { Table } from '@/components/ui/table';
import Badge from '@/components/ui/badge/badge';
import { NoDataFound } from '@/components/icons/no-data-found';
import ActionButtons from '@/components/common/action-buttons';
import { Routes } from '@/config/routes';
import {
  useBatchMarkPaidWithdrawsMutation,
  useExportQueuedWithdrawsMutation,
} from '@/data/settlements-desk';
import { useDeleteWithdrawMutation } from '@/data/withdraw';
import { MappedPaginatorInfo, Shop, Withdraw } from '@/types';
import { useIsRTL } from '@/utils/locals';
import usePrice from '@/utils/use-price';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { siteSettings } from '@/settings/site.settings';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import TruncatedId from '@/components/ui/truncated-id';

type Props = {
  withdraws: Withdraw[];
  paginatorInfo: MappedPaginatorInfo | null;
  onPagination: (page: number) => void;
  /** When true, show bulk mark-paid + export */
  enableBulkPaid?: boolean;
};

function AmountCell({ amount }: { amount?: number }) {
  const { price } = usePrice({ amount: amount ?? 0 });
  return <span>{price}</span>;
}

const SettlementsDeskWithdrawTable = ({
  withdraws,
  paginatorInfo,
  onPagination,
  enableBulkPaid = false,
}: Props) => {
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();
  const markPaid = useBatchMarkPaidWithdrawsMutation();
  const exportCsv = useExportQueuedWithdrawsMutation();
  const { mutate: deleteWithdraw, isLoading: deleting } =
    useDeleteWithdrawMutation();

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelected({});
  }, [withdraws]);

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([id]) => id),
    [selected],
  );

  const allSelected =
    enableBulkPaid &&
    withdraws.length > 0 &&
    withdraws.every((w) => w.id && selected[String(w.id)]);

  const handleMarkPaid = async () => {
    if (!selectedIds.length) return;
    await markPaid.mutateAsync({ ids: selectedIds });
    setSelected({});
  };

  const handleExport = async () => {
    await exportCsv.mutateAsync();
  };

  const columns: any[] = [
    ...(enableBulkPaid
      ? [
          {
            title: (
              <Checkbox
                name="select-all-queued"
                checked={allSelected}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const next: Record<string, boolean> = {};
                  if (checked) {
                    for (const w of withdraws) {
                      if (w.id) next[String(w.id)] = true;
                    }
                  }
                  setSelected(next);
                }}
              />
            ),
            dataIndex: 'id',
            key: 'select',
            align: alignLeft,
            width: 48,
            render: (id: string) => (
              <Checkbox
                name={`select-withdraw-${id}`}
                checked={Boolean(selected[String(id)])}
                onChange={(e) => {
                  setSelected((prev) => ({
                    ...prev,
                    [String(id)]: e.target.checked,
                  }));
                }}
              />
            ),
          },
        ]
      : []),
    {
      title: t('table:table-item-id') || 'ID',
      dataIndex: 'id',
      key: 'id',
      align: alignLeft,
      width: 120,
      render: (id: string) => <TruncatedId id={id} />,
    },
    {
      title: t('table:table-item-shop'),
      dataIndex: 'shop',
      key: 'shop',
      align: alignLeft,
      width: 220,
      render: (shop: Shop) => (
        <div className="flex items-center font-medium">
          <div className="relative me-2 aspect-square h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border-200/80 bg-gray-100">
            <Image
              src={shop?.logo?.thumbnail ?? siteSettings.product.placeholder}
              alt={shop?.name ?? 'Shop'}
              fill
              sizes="36px"
            />
          </div>
          <span className="truncate">{shop?.name ?? '—'}</span>
        </div>
      ),
    },
    {
      title: t('table:table-item-amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'center',
      width: 140,
      render: (amount: number) => <AmountCell amount={amount} />,
    },
    {
      title: t('table:table-item-created-at'),
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'center',
      width: 160,
      render: (date: string) => (
        <span className="whitespace-nowrap">
          {date ? dayjs(date).format('DD MMM YYYY') : '—'}
        </span>
      ),
    },
    {
      title: t('table:table-item-status'),
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 140,
      render: (_: string, record: Withdraw) => {
        const status = String(record?.status_key || record?.status || '');
        const upper = status.toUpperCase();
        if (upper === 'APPROVED') {
          return (
            <Badge
              text={t('common:text-approved') || 'Approved'}
              color="bg-accent bg-opacity-10 !text-accent"
            />
          );
        }
        return (
          <Badge
            text={t('common:text-pending') || 'Pending'}
            color="bg-purple-500 bg-opacity-10 text-purple-500"
          />
        );
      },
    },
    {
      title: t('table:table-item-actions'),
      dataIndex: 'id',
      key: 'actions',
      align: alignRight,
      width: 140,
      render: (id: string) => (
        <div className="flex items-center justify-end gap-2">
          {enableBulkPaid ? (
            <ActionButton
              size="sm"
              variant="secondary"
              disabled={deleting}
              onClick={() => deleteWithdraw({ id })}
            >
              {t('common:text-cancel') || 'Cancel'}
            </ActionButton>
          ) : null}
          <ActionButtons detailsUrl={`${Routes.withdraw.list}/${id}`} id={id} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {enableBulkPaid ? (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            size="sm"
            variant="secondary"
            loading={exportCsv.isLoading}
            onClick={handleExport}
            disabled={!withdraws.length}
          >
            {t('common:text-export-csv') || 'Export CSV'}
          </ActionButton>
          {selectedIds.length > 0 ? (
            <ActionButton
              size="sm"
              variant="primary"
              loading={markPaid.isLoading}
              onClick={handleMarkPaid}
            >
              {t('common:text-mark-paid-n', { count: selectedIds.length }) ||
                `Mark paid (${selectedIds.length})`}
            </ActionButton>
          ) : null}
        </div>
      ) : null}

      <Table
        columns={columns}
        emptyText={() => (
          <div className="flex flex-col items-center py-8">
            <NoDataFound className="w-40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {enableBulkPaid
                ? t('common:text-no-queued-payouts') || 'No queued payouts'
                : t('common:text-no-paid-payouts') || 'No paid payouts yet'}
            </p>
          </div>
        )}
        data={withdraws}
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
    </div>
  );
};

export default SettlementsDeskWithdrawTable;
