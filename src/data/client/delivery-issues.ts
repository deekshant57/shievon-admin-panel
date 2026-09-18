import { Order } from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { HttpClient } from './http-client';

export type DeliveryIssuesQueue = 'issues' | 'in_progress_ops';

export interface DeliveryIssuesQueryOptions {
  page?: number;
  limit?: number;
  queue?: DeliveryIssuesQueue;
  shop_id?: number;
  search?: string;
}

export interface DeliveryIssuesPaginator {
  data: Order[];
  paginator: Record<string, unknown>;
}

export const deliveryIssuesClient = {
  paginated(params: Partial<DeliveryIssuesQueryOptions>) {
    return HttpClient.get<DeliveryIssuesPaginator>(
      API_ENDPOINTS.ADMIN_DELIVERY_ISSUES,
      params,
    );
  },
  get(orderId: string) {
    return HttpClient.get<Order>(
      `${API_ENDPOINTS.ADMIN_DELIVERY_ISSUES}/${orderId}`,
    );
  },
  retryDispatch(orderId: string) {
    return HttpClient.post<Order>(
      `${API_ENDPOINTS.ADMIN_DELIVERY_ISSUES}/${orderId}/retry-dispatch`,
      {},
    );
  },
  cancel(orderId: string, reason?: string) {
    return HttpClient.post<Order>(
      `${API_ENDPOINTS.ADMIN_DELIVERY_ISSUES}/${orderId}/cancel`,
      { reason },
    );
  },
};
