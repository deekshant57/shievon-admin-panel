import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { API_ENDPOINTS } from './client/api-endpoints';
import {
  NotificationAction,
  NotificationTriggerResult,
  NotifyLogsPaginator,
  NotifyLogsQueryOptions,
} from '@/types';
import { mapPaginatorData } from '@/utils/data-mappers';
import { notifyClient } from '@/data/client/notify-logs';
import { getApiErrorMessage } from './client/http-client';

export type TriggerNotificationActionResult =
  | { status: 'triggered'; data: NotificationTriggerResult }
  | { status: 'already_triggered' };

async function triggerNotificationAction(
  action: NotificationAction,
): Promise<TriggerNotificationActionResult> {
  try {
    const data = await notifyClient.trigger(action);
    return { status: 'triggered', data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      return { status: 'already_triggered' };
    }
    throw error;
  }
}

// get all by receiver ID
export const useNotifyLogsQuery = (
  params: Partial<NotifyLogsQueryOptions>,
  options: any = {}
) => {
  const { data, error, isLoading } = useQuery<NotifyLogsPaginator, Error>(
    [API_ENDPOINTS.NOTIFY_LOGS, params],
    ({ queryKey, pageParam }) =>
      notifyClient.paginated(Object.assign({}, queryKey[1], pageParam)),
    {
      keepPreviousData: true,
    }
  );

  return {
    notifyLogs: data?.data ?? [],
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  };
};

// delete
export const useDeleteNotifyLogMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(notifyClient.delete, {
    onSuccess: () => {
      toast.success(t('common:successfully-deleted'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.NOTIFY_LOGS);
    },
  });
};

export const useNotifyLogReadMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(notifyClient.notifyLogSeen, {
    onSuccess: async () => {},
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.NOTIFY_LOG_SEEN);
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data.message}`));
    },
  });
};

export const useNotifyLogAllReadMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation(notifyClient.readAllNotifyLogs, {
    onSuccess: () => {},
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.READ_ALL_NOTIFY_LOG);
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data.message}`));
    },
  });
};

export const useTriggerNotificationActionMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation(triggerNotificationAction, {
    onSuccess: (result) => {
      if (result.status === 'triggered') {
        toast.success(
          t('text-notification-triggered-success') ||
            'Customer notification triggered successfully',
        );
      }
      queryClient.invalidateQueries(API_ENDPOINTS.NOTIFY_LOGS);
      queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
      queryClient.invalidateQueries(API_ENDPOINTS.SHOPS);
      queryClient.invalidateQueries(API_ENDPOINTS.SERVICE_OFFERINGS);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
};
