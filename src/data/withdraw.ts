import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { Routes } from '@/config/routes';
import { API_ENDPOINTS } from './client/api-endpoints';
import { getApiErrorMessage } from './client/http-client';
import {
  WithdrawQueryOptions,
  WithdrawPaginator,
  Withdraw,
} from '@/types';
import { mapPaginatorData } from '@/utils/data-mappers';
import { withdrawClient } from './client/withdraw';

const invalidateWithdrawRelated = (
  queryClient: ReturnType<typeof useQueryClient>,
  shopId?: number | string,
) => {
  queryClient.invalidateQueries(API_ENDPOINTS.WITHDRAWS);
  if (shopId != null) {
    queryClient.invalidateQueries([
      API_ENDPOINTS.VENDOR_SETTLEMENTS,
      shopId,
    ]);
  } else {
    queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_SETTLEMENTS);
  }
  queryClient.invalidateQueries(API_ENDPOINTS.SHOPS);
};

export const useCreateWithdrawMutation = (successRedirect?: string) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation(withdrawClient.create, {
    onSuccess: () => {
      toast.success(t('common:successfully-created') || 'Payout created');
      if (successRedirect) {
        router.push(successRedirect);
        return;
      }
      // Prefer global admin payouts list; fall back to shop list if opened in shop context
      if (router.query.shop) {
        router.push(`/${router.query.shop}/withdraws`);
      } else {
        router.push(Routes.withdraw.list);
      }
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
    onSettled: (_data, _error, variables) => {
      invalidateWithdrawRelated(queryClient, variables?.shop_id);
    },
  });
};

export const useApproveWithdrawMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(withdrawClient.approve, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries([
        API_ENDPOINTS.WITHDRAWS,
        { id: variables.id },
      ]);
      invalidateWithdrawRelated(queryClient);
    },
  });
};

export const useDeleteWithdrawMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(withdrawClient.delete, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
    onSettled: () => {
      invalidateWithdrawRelated(queryClient);
    },
  });
};

export const useWithdrawQuery = ({ id }: { id: string }) => {
  const { data, error, isLoading } = useQuery<Withdraw, Error>(
    [API_ENDPOINTS.WITHDRAWS, { id }],
    () => withdrawClient.get({ id })
  );

  return {
    withdraw: data,
    error,
    isLoading,
  };
};

export const useWithdrawsQuery = (
  params: Partial<WithdrawQueryOptions>,
  options: any = {}
) => {
  const { data, error, isLoading } = useQuery<WithdrawPaginator, Error>(
    [API_ENDPOINTS.WITHDRAWS, params],
    ({ queryKey, pageParam }) =>
      withdrawClient.paginated(Object.assign({}, queryKey[1], pageParam)),
    {
      keepPreviousData: true,
      ...options,
    }
  );

  return {
    withdraws: data?.data ?? [],
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  };
};
