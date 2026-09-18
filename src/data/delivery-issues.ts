import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from './client/api-endpoints';
import { Order } from '@/types';
import { mapPaginatorData } from '@/utils/data-mappers';
import {
  deliveryIssuesClient,
  DeliveryIssuesQueryOptions,
} from '@/data/client/delivery-issues';
import { getApiErrorMessage } from './client/http-client';

export const useDeliveryIssuesQuery = (
  params: Partial<DeliveryIssuesQueryOptions>,
  options: Record<string, unknown> = {},
) => {
  const { data, error, isLoading } = useQuery(
    [API_ENDPOINTS.ADMIN_DELIVERY_ISSUES, params],
    () => deliveryIssuesClient.paginated(params),
    {
      keepPreviousData: true,
      ...options,
    },
  );

  return {
    orders: data?.data ?? [],
    paginatorInfo: data?.paginator
      ? mapPaginatorData({ ...(data.paginator as any), data: data.data })
      : null,
    error,
    loading: isLoading,
  };
};

export const useDeliveryIssueQuery = (orderId?: string) => {
  return useQuery<Order, Error>(
    [API_ENDPOINTS.ADMIN_DELIVERY_ISSUES, orderId],
    () => deliveryIssuesClient.get(orderId!),
    { enabled: Boolean(orderId) },
  );
};

export const useRetryDeliveryDispatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (orderId: string) => deliveryIssuesClient.retryDispatch(orderId),
    {
      onSuccess: () => {
        toast.success('Dropit dispatch re-scheduled');
      },
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.ADMIN_DELIVERY_ISSUES);
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
    },
  );
};

export const useCancelDeliveryIssueOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ orderId, reason }: { orderId: string; reason?: string }) =>
      deliveryIssuesClient.cancel(orderId, reason),
    {
      onSuccess: () => {
        toast.success('Order cancelled successfully');
      },
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.ADMIN_DELIVERY_ISSUES);
        queryClient.invalidateQueries(API_ENDPOINTS.ORDERS);
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
    },
  );
};
