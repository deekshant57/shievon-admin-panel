import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { API_ENDPOINTS } from './client/api-endpoints';
import { getApiErrorMessage } from './client/http-client';
import { settlementsDeskClient } from './client/settlements-desk';
import {
  BatchWithdrawItemInput,
  SettlementDeskMeta,
  SettlementDeskQueryOptions,
  SettlementDeskRow,
} from '@/types';
import { mapPaginatorData } from '@/utils/data-mappers';

export type SettlementsDeskResult = {
  rows: SettlementDeskRow[];
  meta?: SettlementDeskMeta;
  paginatorInfo: ReturnType<typeof mapPaginatorData>;
};

function pickMeta(raw: any): SettlementDeskMeta | undefined {
  const src = raw?.meta ?? raw;
  if (!src || typeof src !== 'object') return undefined;
  const meta: SettlementDeskMeta = {
    ready_count: src.ready_count ?? src.readyCount,
    attention_count: src.attention_count ?? src.attentionCount,
    queued_count: src.queued_count ?? src.queuedCount,
    total_pending_ready:
      src.total_pending_ready ?? src.totalPendingReady,
  };
  if (
    meta.ready_count == null &&
    meta.attention_count == null &&
    meta.queued_count == null &&
    meta.total_pending_ready == null
  ) {
    return undefined;
  }
  return meta;
}

function normalizeDeskRow(row: any): SettlementDeskRow {
  const shopId =
    row?.shop_id ?? row?.shopId ?? row?.shop?.id ?? row?.id;
  const bank = row?.bank ?? {};
  const open = row?.open_payout ?? row?.openPayout ?? null;

  return {
    shop_id: shopId,
    shop_name:
      row?.shop_name ?? row?.shopName ?? row?.shop?.name ?? String(shopId ?? ''),
    shop_slug: row?.shop_slug ?? row?.shopSlug ?? row?.shop?.slug ?? '',
    pending: Number(row?.pending ?? 0),
    received: row?.received,
    total_earnings: row?.total_earnings ?? row?.totalEarnings,
    todays_collection: row?.todays_collection ?? row?.todaysCollection,
    total_collection: row?.total_collection ?? row?.totalCollection,
    settlement_eta_message:
      row?.settlement_eta_message ?? row?.settlementEtaMessage,
    bank: bank
      ? {
          verification_status:
            bank.verification_status ?? bank.verificationStatus,
          incomplete: bank.incomplete,
          name: bank.name,
          bank: bank.bank,
          ifsc: bank.ifsc,
          masked_account: bank.masked_account ?? bank.maskedAccount,
        }
      : null,
    open_payout: open
      ? {
          id: String(open.id),
          amount: Number(open.amount ?? 0),
          status: open.status,
          status_key: open.status_key ?? open.statusKey,
        }
      : null,
    on_hold: Boolean(row?.on_hold ?? row?.onHold),
    can_queue: Boolean(row?.can_queue ?? row?.canQueue),
    block_reason: row?.block_reason ?? row?.blockReason ?? null,
    min_payout_amount:
      row?.min_payout_amount ?? row?.minPayoutAmount ?? 500,
  };
}

function normalizeDeskResponse(raw: any): SettlementsDeskResult {
  const list: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.items)
        ? raw.items
        : [];
  const rows = list.map(normalizeDeskRow);
  const meta = pickMeta(raw);

  return {
    rows,
    meta,
    paginatorInfo: mapPaginatorData(
      Array.isArray(raw) ? { data: raw } : raw,
    ),
  };
}

export const useSettlementsDeskQuery = (
  params: Partial<SettlementDeskQueryOptions>,
  options: { enabled?: boolean } = {},
) => {
  const { data, error, isLoading, isFetching, refetch } = useQuery<
    SettlementsDeskResult,
    Error
  >(
    [API_ENDPOINTS.ADMIN_VENDOR_SETTLEMENTS, params],
    async () => {
      const raw = await settlementsDeskClient.desk(params);
      return normalizeDeskResponse(raw);
    },
    {
      keepPreviousData: true,
      enabled: options.enabled,
    },
  );

  return {
    rows: data?.rows ?? [],
    meta: data?.meta,
    paginatorInfo: data?.paginatorInfo ?? null,
    error,
    loading: isLoading,
    isFetching,
    refetch,
  };
};

const invalidateDesk = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries(API_ENDPOINTS.ADMIN_VENDOR_SETTLEMENTS);
  queryClient.invalidateQueries(API_ENDPOINTS.WITHDRAWS);
  queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_SETTLEMENTS);
  queryClient.invalidateQueries(API_ENDPOINTS.SHOPS);
};

export const useBatchQueueWithdrawsMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation(
    (items: BatchWithdrawItemInput[]) => {
      const normalized = items
        .map((item) => {
          const shopId = Number(item.shop_id);
          if (!Number.isFinite(shopId) || shopId <= 0) return null;
          return {
            shop_id: shopId,
            amount: Number(item.amount),
            note: item.note ?? null,
          };
        })
        .filter(Boolean) as BatchWithdrawItemInput[];
      if (!normalized.length) {
        return Promise.reject(new Error('shop_id is required'));
      }
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `batch-${Date.now()}`;
      return settlementsDeskClient.queueBatch(normalized, idempotencyKey);
    },
    {
      onSuccess: (result) => {
        const ok = result.created?.length ?? 0;
        const fail = result.failed?.length ?? 0;
        if (ok > 0) {
          toast.success(
            t('common:text-queued-payouts-count', { count: ok }) ||
              `Queued ${ok} payout${ok === 1 ? '' : 's'}`,
          );
        }
        if (fail > 0) {
          toast.error(
            t('common:text-queue-failed-count', { count: fail }) ||
              `${fail} payout${fail === 1 ? '' : 's'} failed to queue`,
          );
        }
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
      onSettled: () => {
        invalidateDesk(queryClient);
      },
    },
  );
};

export const useQueueSingleWithdrawMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation(
    async (item: BatchWithdrawItemInput) => {
      const shopId = Number(item.shop_id);
      if (!Number.isFinite(shopId) || shopId <= 0) {
        return Promise.reject(new Error('shop_id is required'));
      }
      const amount = Number(item.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return Promise.reject(new Error('amount is required'));
      }

      // Prefer batch endpoint — its DTO has class-validator decorators.
      // Legacy POST /withdraws stripped undecorated shop_id under whitelist:true.
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `single-${Date.now()}`;
      const result = await settlementsDeskClient.queueBatch(
        [
          {
            shop_id: shopId,
            amount,
            note: item.note ?? null,
          },
        ],
        idempotencyKey,
      );
      if (result.failed?.length) {
        const fail = result.failed[0];
        throw new Error(fail.message || fail.code || 'Failed to queue payout');
      }
      return result.created?.[0];
    },
    {
      onSuccess: () => {
        toast.success(
          t('common:text-payout-queued') || 'Payout queued',
        );
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : getApiErrorMessage(error);
        toast.error(message);
      },
      onSettled: (_d, _e, variables) => {
        invalidateDesk(queryClient);
        if (variables?.shop_id != null) {
          queryClient.invalidateQueries([
            API_ENDPOINTS.VENDOR_SETTLEMENTS,
            variables.shop_id,
          ]);
        }
      },
    },
  );
};

export const useBatchMarkPaidWithdrawsMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation(
    ({ ids, note }: { ids: string[]; note?: string }) =>
      settlementsDeskClient.markPaidBatch(ids, note),
    {
      onSuccess: (result) => {
        const ok = result.updated?.length ?? 0;
        const fail = result.failed?.length ?? 0;
        if (ok > 0) {
          toast.success(
            t('common:text-marked-paid-count', { count: ok }) ||
              `Marked ${ok} payout${ok === 1 ? '' : 's'} as paid`,
          );
        }
        if (fail > 0) {
          toast.error(
            t('common:text-mark-paid-failed-count', { count: fail }) ||
              `${fail} payout${fail === 1 ? '' : 's'} failed`,
          );
        }
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
      onSettled: () => {
        invalidateDesk(queryClient);
      },
    },
  );
};

export const useSetSettlementHoldMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation(
    ({ shopId, onHold }: { shopId: string | number; onHold: boolean }) =>
      settlementsDeskClient.setSettlementHold(shopId, onHold),
    {
      onSuccess: (_data, variables) => {
        toast.success(
          variables.onHold
            ? t('common:text-settlement-held') || 'Settlement put on hold'
            : t('common:text-settlement-hold-cleared') ||
                'Settlement hold cleared',
        );
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
      onSettled: () => {
        invalidateDesk(queryClient);
      },
    },
  );
};

export const useExportQueuedWithdrawsMutation = () => {
  const { t } = useTranslation();

  return useMutation(
    async () => {
      const blob = await settlementsDeskClient.exportQueued('pending');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'queued-payouts.csv';
      a.click();
      URL.revokeObjectURL(url);
    },
    {
      onSuccess: () => {
        toast.success(
          t('common:text-export-started') || 'Export downloaded',
        );
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
    },
  );
};
