import { useMutation, useQuery, useQueryClient } from 'react-query';
import { API_ENDPOINTS } from './client/api-endpoints';
import { vendorNotificationsClient } from './client/vendor-notifications';
import type { VendorNotificationQueryOptions } from '@/types';
import { getApiErrorMessage } from './client/http-client';
import { toast } from 'react-toastify';

const POLL_INTERVAL_MS = 30_000;

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
      refetchInterval: options.refetchInterval ?? POLL_INTERVAL_MS,
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
      refetchInterval: options.refetchInterval ?? POLL_INTERVAL_MS,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    },
  );

  return {
    count: data?.count ?? 0,
    unreadCount: data?.count ?? 0,
    error,
    loading: isLoading,
    refetch,
  };
};

export const useVendorNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (input: string | { id: string }) =>
      vendorNotificationsClient.markRead(
        typeof input === 'string' ? input : input.id,
      ),
    {
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_NOTIFICATIONS);
        queryClient.invalidateQueries(
          API_ENDPOINTS.VENDOR_NOTIFICATIONS_UNREAD_COUNT,
        );
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
    },
  );
};

export const useVendorNotificationsReadAllMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (body?: Pick<VendorNotificationQueryOptions, 'shop_id'>) =>
      vendorNotificationsClient.markAllRead(body),
    {
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_NOTIFICATIONS);
        queryClient.invalidateQueries(
          API_ENDPOINTS.VENDOR_NOTIFICATIONS_UNREAD_COUNT,
        );
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
    },
  );
};

/** Aliases used by RecentOrderBar */
export const useMarkVendorNotificationReadMutation =
  useVendorNotificationReadMutation;
export const useMarkAllVendorNotificationsReadMutation =
  useVendorNotificationsReadAllMutation;
