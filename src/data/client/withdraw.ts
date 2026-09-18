import {
  Withdraw,
  WithdrawPaginator,
  WithdrawQueryOptions,
  CreateWithdrawInput,
  QueryOptions,
  ApproveWithdrawInput,
} from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { crudFactory } from './curd-factory';
import { HttpClient } from './http-client';

/** Coerce shop id to a positive integer for withdraw APIs. */
export function coerceWithdrawShopId(
  raw: unknown,
): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || Number.isNaN(n) || n <= 0) return null;
  return Math.trunc(n);
}

export const withdrawClient = {
  ...crudFactory<Withdraw, QueryOptions, CreateWithdrawInput>(
    API_ENDPOINTS.WITHDRAWS,
  ),

  /**
   * Queue a payout. Uses batch endpoint so shop_id survives ValidationPipe whitelist
   * (single POST /withdraws DTO historically lacked decorators and stripped the body).
   */
  create(input: CreateWithdrawInput) {
    const shopId = coerceWithdrawShopId(input.shop_id);
    if (shopId == null) {
      return Promise.reject(new Error('shop_id is required'));
    }
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Promise.reject(new Error('amount is required'));
    }
    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `create-${Date.now()}`;
    return HttpClient.post<{
      created: Withdraw[];
      failed: Array<{ shop_id?: number; message?: string; code?: string }>;
    }>(
      API_ENDPOINTS.WITHDRAWS_BATCH,
      {
        items: [
          {
            shop_id: shopId,
            amount,
            note: input.note ?? null,
          },
        ],
      },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    ).then((result) => {
      if (result?.failed?.length) {
        const fail = result.failed[0];
        throw Object.assign(new Error(fail.message || fail.code || 'Failed'), {
          response: { data: { message: fail.message || fail.code } },
        });
      }
      const created = result?.created?.[0];
      if (!created) {
        throw new Error('Failed to queue payout');
      }
      return created;
    });
  },

  get({ id }: { id: string }) {
    return HttpClient.get<Withdraw>(`${API_ENDPOINTS.WITHDRAWS}/${id}`);
  },

  paginated: ({
    shop_id,
    status,
    name,
    ...params
  }: Partial<WithdrawQueryOptions> & { status?: string }) => {
    const shopId = coerceWithdrawShopId(shop_id);
    const searchBits: Record<string, string | number> = {};
    if (shopId != null) searchBits.shop_id = shopId;
    if (status) searchBits.status = status;
    if (name) searchBits.name = name;

    return HttpClient.get<WithdrawPaginator>(API_ENDPOINTS.WITHDRAWS, {
      searchJoin: 'and',
      ...params,
      ...(shopId != null ? { shop_id: shopId } : {}),
      ...(status ? { status } : {}),
      ...(Object.keys(searchBits).length
        ? { search: HttpClient.formatSearchParams(searchBits as any) }
        : {}),
    });
  },

  approve({ id, ...body }: ApproveWithdrawInput) {
    return HttpClient.post<Withdraw>(
      `${API_ENDPOINTS.WITHDRAWS}/${id}/approve`,
      body,
    );
  },
};
