import {
  BatchMarkPaidWithdrawsResponse,
  BatchQueueWithdrawsResponse,
  BatchWithdrawItemInput,
  SettlementDeskPaginator,
  SettlementDeskQueryOptions,
  Withdraw,
} from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { HttpClient } from './http-client';

export const settlementsDeskClient = {
  desk(params: Partial<SettlementDeskQueryOptions> = {}) {
    return HttpClient.get<SettlementDeskPaginator>(
      API_ENDPOINTS.ADMIN_VENDOR_SETTLEMENTS,
      params,
    );
  },

  queueBatch(items: BatchWithdrawItemInput[], idempotencyKey?: string) {
    return HttpClient.post<BatchQueueWithdrawsResponse>(
      API_ENDPOINTS.WITHDRAWS_BATCH,
      { items },
      idempotencyKey
        ? { headers: { 'Idempotency-Key': idempotencyKey } }
        : undefined,
    );
  },

  markPaidBatch(ids: string[], note?: string) {
    return HttpClient.post<BatchMarkPaidWithdrawsResponse>(
      API_ENDPOINTS.WITHDRAWS_MARK_PAID_BATCH,
      { ids, note },
    );
  },

  exportQueued(status: string = 'pending') {
    return HttpClient.getBlob(
      `${API_ENDPOINTS.WITHDRAWS_EXPORT}?status=${encodeURIComponent(status)}`,
    );
  },

  /** Single queue uses withdrawClient.create — kept for symmetry */
  queueOne(input: BatchWithdrawItemInput) {
    return HttpClient.post<Withdraw>(API_ENDPOINTS.WITHDRAWS, input);
  },

  setSettlementHold(shopId: string | number, onHold: boolean) {
    return HttpClient.patch<{ on_hold: boolean }>(
      `${API_ENDPOINTS.SHOPS}/${shopId}/settlement-hold`,
      { on_hold: onHold },
    );
  },
};
