import ActionButton from '@/components/ui/action-button';
import Badge from '@/components/ui/badge/badge';
import Checkbox from '@/components/ui/checkbox/checkbox';
import Input from '@/components/ui/input';
import Link from '@/components/ui/link';
import Pagination from '@/components/ui/pagination';
import { Table } from '@/components/ui/table';
import { NoDataFound } from '@/components/icons/no-data-found';
import {
  useBatchQueueWithdrawsMutation,
  useQueueSingleWithdrawMutation,
  useSetSettlementHoldMutation,
} from '@/data/settlements-desk';
import { coerceWithdrawShopId } from '@/data/client/withdraw';
import { SettlementDeskRow } from '@/types';
import {
  MIN_PAYOUT_AMOUNT,
  blockReasonLabel,
} from '@/utils/settlements-desk';
import { useIsRTL } from '@/utils/locals';
import usePrice from '@/utils/use-price';
import { useTranslation } from 'next-i18next';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  rows: SettlementDeskRow[];
  mode: 'ready' | 'attention';
  paginatorInfo: {
    total: number;
    currentPage: number;
    perPage?: number;
  } | null;
  onPagination: (page: number) => void;
};

function PendingCell({ amount }: { amount: number }) {
  const { price } = usePrice({ amount });
  return <span className="whitespace-nowrap font-medium">{price}</span>;
}

function BankCell({ row }: { row: SettlementDeskRow }) {
  const { t } = useTranslation();
  const status = row.bank?.verification_status ?? 'unverified';
  const statusLabel =
    status === 'verified'
      ? t('common:text-bank-verified') || 'Verified'
      : status === 'pending'
        ? t('common:text-bank-pending') || 'Pending'
        : status === 'failed'
          ? t('common:text-bank-failed') || 'Failed'
          : t('common:text-bank-unverified') || 'Unverified';

  const color =
    status === 'verified'
      ? 'bg-accent bg-opacity-10 !text-accent'
      : status === 'pending'
        ? 'bg-yellow-500 bg-opacity-10 text-yellow-600'
        : 'bg-red-500 bg-opacity-10 text-red-500';

  return (
    <div className="min-w-[140px] space-y-1">
      <Badge text={statusLabel} color={color} />
      {row.bank?.bank || row.bank?.masked_account ? (
        <p className="text-xs text-muted-foreground">
          {[row.bank?.bank, row.bank?.masked_account].filter(Boolean).join(' · ')}
        </p>
      ) : null}
    </div>
  );
}

const SettlementsDeskShopTable = ({
  rows,
  mode,
  paginatorInfo,
  onPagination,
}: Props) => {
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();
  const queueOne = useQueueSingleWithdrawMutation();
  const queueBatch = useBatchQueueWithdrawsMutation();
  const setHold = useSetSettlementHoldMutation();

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [queuingId, setQueuingId] = useState<string | null>(null);

  useEffect(() => {
    setSelected({});
    const next: Record<string, string> = {};
    for (const row of rows) {
      next[String(row.shop_id)] = String(row.pending ?? 0);
    }
    setAmounts(next);
  }, [rows]);

  const selectedRows = useMemo(
    () => rows.filter((r) => selected[String(r.shop_id)] && r.can_queue),
    [rows, selected],
  );

  const allReadySelected =
    mode === 'ready' &&
    rows.length > 0 &&
    rows.every((r) => selected[String(r.shop_id)]);

  const parseAmount = (shopId: string | number, pending: number) => {
    const raw = amounts[String(shopId)];
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (n < MIN_PAYOUT_AMOUNT) return null;
    if (n > pending) return null;
    return n;
  };

  const handleQueueOne = async (row: SettlementDeskRow) => {
    const shopId = coerceWithdrawShopId(row.shop_id);
    const amount = parseAmount(row.shop_id, row.pending);
    if (shopId == null || amount == null) {
      return;
    }
    setQueuingId(String(shopId));
    try {
      await queueOne.mutateAsync({
        shop_id: shopId,
        amount,
      });
    } finally {
      setQueuingId(null);
    }
  };

  const handleQueueSelected = async () => {
    const items = selectedRows
      .map((row) => {
        const shopId = coerceWithdrawShopId(row.shop_id);
        const amount = parseAmount(row.shop_id, row.pending);
        if (shopId == null || amount == null) return null;
        return { shop_id: shopId, amount };
      })
      .filter(Boolean) as Array<{ shop_id: number; amount: number }>;
    if (!items.length) return;
    await queueBatch.mutateAsync(items);
    setSelected({});
  };

  const columns: any[] = [
    ...(mode === 'ready'
      ? [
          {
            title: (
              <Checkbox
                name="select-all-ready"
                checked={allReadySelected}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const next: Record<string, boolean> = {};
                  if (checked) {
                    for (const r of rows) {
                      next[String(r.shop_id)] = true;
                    }
                  }
                  setSelected(next);
                }}
              />
            ),
            dataIndex: 'shop_id',
            key: 'select',
            align: alignLeft,
            width: 48,
            render: (_: unknown, row: SettlementDeskRow) => (
              <Checkbox
                name={`select-${row.shop_id}`}
                checked={Boolean(selected[String(row.shop_id)])}
                onChange={(e) => {
                  setSelected((prev) => ({
                    ...prev,
                    [String(row.shop_id)]: e.target.checked,
                  }));
                }}
              />
            ),
          },
        ]
      : []),
    {
      title: t('table:table-item-shop') || 'Shop',
      dataIndex: 'shop_name',
      key: 'shop_name',
      align: alignLeft,
      render: (_: unknown, row: SettlementDeskRow) => (
        <div className="min-w-[140px]">
          <Link
            href={`/${row.shop_slug}`}
            className="font-medium text-accent hover:underline"
          >
            {row.shop_name}
          </Link>
          {row.settlement_eta_message ? (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {row.settlement_eta_message}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      title: t('common:text-pending-payout') || 'Pending',
      dataIndex: 'pending',
      key: 'pending',
      align: alignRight,
      render: (pending: number) => <PendingCell amount={pending} />,
    },
    {
      title: t('common:text-bank') || 'Bank',
      dataIndex: 'bank',
      key: 'bank',
      align: alignLeft,
      render: (_: unknown, row: SettlementDeskRow) => <BankCell row={row} />,
    },
    {
      title: t('common:text-open-payout') || 'Open payout',
      dataIndex: 'open_payout',
      key: 'open_payout',
      align: alignLeft,
      render: (_: unknown, row: SettlementDeskRow) =>
        row.open_payout ? (
          <span className="text-sm">
            ₹{Number(row.open_payout.amount).toLocaleString('en-IN')} ·{' '}
            {row.open_payout.status_key || row.open_payout.status}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  if (mode === 'ready') {
    columns.push(
      {
        title: t('common:text-amount') || 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: alignLeft,
        width: 140,
        render: (_: unknown, row: SettlementDeskRow) => {
          const key = String(row.shop_id);
          const value = amounts[key] ?? String(row.pending);
          const n = Number(value);
          const invalid =
            !Number.isFinite(n) ||
            n < MIN_PAYOUT_AMOUNT ||
            n > row.pending;
          return (
            <Input
              name={`amount-${key}`}
              type="number"
              min={MIN_PAYOUT_AMOUNT}
              max={row.pending}
              step="1"
              value={value}
              onChange={(e) =>
                setAmounts((prev) => ({ ...prev, [key]: e.target.value }))
              }
              error={
                invalid
                  ? t('common:text-amount-out-of-range') ||
                    `₹${MIN_PAYOUT_AMOUNT}–pending`
                  : undefined
              }
              variant="outline"
              className="mb-0 min-w-[110px]"
              inputClassName="!h-9"
            />
          );
        },
      },
      {
        title: t('common:text-actions') || 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        align: alignRight,
        render: (_: unknown, row: SettlementDeskRow) => {
          const shopId = coerceWithdrawShopId(row.shop_id);
          const amount = parseAmount(row.shop_id, row.pending);
          const loading =
            queuingId === String(row.shop_id) || queueOne.isLoading;
          return (
            <ActionButton
              size="sm"
              variant="primary"
              disabled={
                shopId == null ||
                amount == null ||
                loading ||
                !row.can_queue
              }
              loading={loading && queuingId === String(row.shop_id)}
              onClick={() => handleQueueOne(row)}
            >
              {t('common:text-queue-payout') || 'Queue payout'}
            </ActionButton>
          );
        },
      },
    );
  } else {
    columns.push({
      title: t('common:text-block-reason') || 'Reason',
      dataIndex: 'block_reason',
      key: 'block_reason',
      align: alignLeft,
      render: (_: unknown, row: SettlementDeskRow) => (
        <div className="min-w-[160px] space-y-1">
          <p className="text-sm text-heading">
            {blockReasonLabel(row.block_reason)}
          </p>
          {(row.block_reason === 'BANK_INCOMPLETE' ||
            row.block_reason === 'BANK_UNVERIFIED') &&
          row.shop_slug ? (
            <Link
              href={`/${row.shop_slug}/edit`}
              className="text-xs text-accent hover:underline"
            >
              {t('common:text-fix-bank-details') || 'Fix bank details'}
            </Link>
          ) : null}
          {row.on_hold || row.block_reason === 'ON_HOLD' ? (
            <ActionButton
              size="sm"
              variant="secondary"
              loading={setHold.isLoading}
              className="mt-1"
              onClick={() =>
                setHold.mutate({ shopId: row.shop_id, onHold: false })
              }
            >
              {t('common:text-clear-settlement-hold') || 'Clear hold'}
            </ActionButton>
          ) : null}
        </div>
      ),
    });
  }

  return (
    <div className="space-y-4">
      {mode === 'ready' && selectedRows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            size="sm"
            variant="primary"
            loading={queueBatch.isLoading}
            onClick={handleQueueSelected}
          >
            {t('common:text-queue-n-payouts', {
              count: selectedRows.length,
            }) || `Queue ${selectedRows.length} payouts`}
          </ActionButton>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-heading"
            onClick={() => setSelected({})}
          >
            {t('common:text-clear-selection') || 'Clear selection'}
          </button>
        </div>
      ) : null}

      <Table
        columns={columns}
        emptyText={() => (
          <div className="flex flex-col items-center py-8">
            <NoDataFound className="w-40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {mode === 'ready'
                ? t('common:text-no-ready-payouts') ||
                  'No shops ready to queue'
                : t('common:text-no-attention-payouts') ||
                  'No shops need attention'}
            </p>
          </div>
        )}
        data={rows}
        rowKey="shop_id"
        scroll={{ x: 900 }}
      />

      {paginatorInfo?.total && paginatorInfo.total > (paginatorInfo.perPage ?? 10) ? (
        <div className="flex items-center justify-end">
          <Pagination
            total={paginatorInfo.total}
            current={paginatorInfo.currentPage}
            pageSize={paginatorInfo.perPage ?? 20}
            onChange={onPagination}
          />
        </div>
      ) : null}
    </div>
  );
};

export default SettlementsDeskShopTable;
