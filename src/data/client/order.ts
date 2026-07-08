import {
  Order,
  CreateOrderInput,
  OrderQueryOptions,
  OrderPaginator,
  QueryOptions,
  InvoiceTranslatedText,
  GenerateInvoiceDownloadUrlInput,
} from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { crudFactory } from './curd-factory';
import { HttpClient } from './http-client';

export const orderClient = {
  ...crudFactory<Order, QueryOptions, CreateOrderInput>(API_ENDPOINTS.ORDERS),
  get: ({ id, language }: { id: string; language: string }) => {
    return HttpClient.get<Order>(`${API_ENDPOINTS.ORDERS}/${id}`, {
      language,
    });
  },
  paginated: ({ tracking_number, ...params }: Partial<OrderQueryOptions>) => {
    return HttpClient.get<OrderPaginator>(API_ENDPOINTS.ORDERS, {
      searchJoin: 'and',
      ...params,
      search: HttpClient.formatSearchParams({ tracking_number }),
    });
  },
  downloadInvoice: (input: GenerateInvoiceDownloadUrlInput) => {
    return HttpClient.post<string>(
      `${API_ENDPOINTS.ORDER_INVOICE_DOWNLOAD}`,
      input
    );
  },
  orderSeen({ id }: { id: string }) {
    return HttpClient.post<any>(`${API_ENDPOINTS.ORDER_SEEN}/${id}`, id);
  },
  markProductLinesReady(
    id: string,
    data?: { order_item_ids?: string[] },
  ) {
    return HttpClient.post<Order>(
      `${API_ENDPOINTS.ORDERS}/${id}/product-lines/mark-ready`,
      data ?? {},
    );
  },
  confirmProductPickup(
    id: string,
    itemId: string,
    data?: { quantity?: number },
  ) {
    return HttpClient.post<Order>(
      `${API_ENDPOINTS.ORDERS}/${id}/product-lines/${itemId}/confirm-pickup`,
      data ?? {},
    );
  },
  unableToFulfillProductLine(
    id: string,
    itemId: string,
    data: { reason: string },
  ) {
    return HttpClient.post<Order>(
      `${API_ENDPOINTS.ORDERS}/${id}/product-lines/${itemId}/unable-to-fulfill`,
      data,
    );
  },
  completeServiceBooking(id: string) {
    return HttpClient.post<Order>(
      `${API_ENDPOINTS.ORDERS}/${id}/service-booking/complete`,
      {},
    );
  },
  unableToFulfillServiceBooking(id: string, data: { reason: string }) {
    return HttpClient.post<Order>(
      `${API_ENDPOINTS.ORDERS}/${id}/service-booking/unable-to-fulfill`,
      data,
    );
  },
  closeOrder(id: string) {
    return HttpClient.post<Order>(`${API_ENDPOINTS.ORDERS}/${id}/close`, {});
  },
};
