import { HttpClient } from './http-client';
import { API_ENDPOINTS } from './api-endpoints';
import type {
  VendorNotification,
  VendorNotificationListPayload,
  VendorNotificationQueryOptions,
} from '@/types';

export const vendorNotificationsClient = {
  paginated(params: Partial<VendorNotificationQueryOptions> = {}) {
    return HttpClient.get<VendorNotificationListPayload>(
      API_ENDPOINTS.VENDOR_NOTIFICATIONS,
      params,
    );
  },
  unreadCount(params?: Pick<VendorNotificationQueryOptions, 'shop_id'>) {
    return HttpClient.get<{ count: number }>(
      API_ENDPOINTS.VENDOR_NOTIFICATIONS_UNREAD_COUNT,
      params,
    );
  },
  markRead(id: string) {
    return HttpClient.put<VendorNotification>(
      `${API_ENDPOINTS.VENDOR_NOTIFICATIONS}/${id}/read`,
      {},
    );
  },
  markAllRead(body?: Pick<VendorNotificationQueryOptions, 'shop_id'>) {
    return HttpClient.put<{ updated_count: number }>(
      API_ENDPOINTS.VENDOR_NOTIFICATIONS_READ_ALL,
      body ?? {},
    );
  },
};
