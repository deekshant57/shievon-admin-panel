import { useMutation, useQuery, useQueryClient } from 'react-query';
import { API_ENDPOINTS } from './client/api-endpoints';
import { vendorNotificationsClient } from './client/vendor-notifications';
import type { VendorNotificationQueryOptions } from '@/types';
import { getApiErrorMessage } from './client/http-client';
import { toast } from 'react-toastify';
import { Config } from '@/config';

const POLL_INTERVAL_MS = 30_000;

/** Poll only when Pusher real-time is disabled. */
export function vendorNotificationsPollInterval(): number | false {
  if (Config.broadcastDriver === 'pusher' && Config.pusherEnable === 'true') {
    return false;
  }
  return POLL_INTERVAL_MS;
}

export const useVendorNotificationsQuery = (
  params: Partial<VendorNotificationQueryOptions> = {},
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
) => {
  const { data, error, isLoading, refetch } = useQuery(
    [API_ENDPOINTS.VENDOR_NOTIFICATIONS, params],
    () => vendorNotificationsClient.paginated(params),
    {
      keepPreviousData: true,
      enabled: options.enabled ?? true,
      refetchInterval: options.refetchInterval ?? vendorNotificationsPollInterval(),
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    },
  );

  return {
    notifications: data?.data ?? [],
    paginator: data?.paginator,
    error,
    loading: isLoading,
    refetch,
  };
};

export const useVendorNotificationsUnreadCountQuery = (
  params: Pick<VendorNotificationQueryOptions, 'shop_id'> = {},
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
) => {
  const { data, error, isLoading, refetch } = useQuery(
    [API_ENDPOINTS.VENDOR_NOTIFICATIONS_UNREAD_COUNT, params],
    () => vendorNotificationsClient.unreadCount(params),
    {
      enabled: options.enabled ?? true,
      refetchInterval: options.refetchInterval ?? vendorNotificationsPollInterval(),
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    },
  );

  return {
    count: data?.count ?? 0,
    error,
    loading: isLoading,
    refetch,
  };
};

export const useVendorNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation((id: string) => vendorNotificationsClient.markRead(id), {
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_NOTIFICATIONS);
      queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_NOTIFICATIONS_UNREAD_COUNT);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
};

export const useVendorNotificationsReadAllMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (body?: Pick<VendorNotificationQueryOptions, 'shop_id'>) =>
      vendorNotificationsClient.markAllRead(body),
    {
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_NOTIFICATIONS);
        queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_NOTIFICATIONS_UNREAD_COUNT);
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
    },
  );
};
