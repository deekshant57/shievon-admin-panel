import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { API_ENDPOINTS } from './client/api-endpoints';
import { getApiErrorMessage } from './client/http-client';
import { vendorSettlementClient } from './client/vendor-settlement';
import { PaymentInfoInput, VendorSettlementSummary } from '@/types';

export const useVendorSettlementQuery = (
  shopId?: string | number | null,
  options: Record<string, unknown> = {},
) => {
  const { data, error, isLoading, isFetching, refetch } = useQuery<
    VendorSettlementSummary,
    Error
  >(
    [API_ENDPOINTS.VENDOR_SETTLEMENTS, shopId],
    () => vendorSettlementClient.get(shopId!),
    {
      enabled: Boolean(shopId),
      ...options,
    },
  );

  return {
    settlement: data,
    error,
    loading: isLoading,
    isFetching,
    refetch,
  };
};

export const useUpdateSettlementPaymentInfoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      shopId,
      ...data
    }: PaymentInfoInput & { shopId: string | number }) =>
      vendorSettlementClient.updatePaymentInfo(shopId, data),
    {
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
      onSettled: (_data, _error, variables) => {
        queryClient.invalidateQueries([
          API_ENDPOINTS.VENDOR_SETTLEMENTS,
          variables.shopId,
        ]);
        queryClient.invalidateQueries(API_ENDPOINTS.SHOPS);
        queryClient.invalidateQueries(API_ENDPOINTS.MY_SHOPS);
      },
    },
  );
};

export const useVerifySettlementPaymentInfoMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation(
    (shopId: string | number) =>
      vendorSettlementClient.verifyPaymentInfo(shopId),
    {
      onSuccess: () => {
        toast.success(
          t('common:text-bank-verified') || 'Bank details verified',
        );
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
      onSettled: (_data, _error, shopId) => {
        queryClient.invalidateQueries([
          API_ENDPOINTS.VENDOR_SETTLEMENTS,
          shopId,
        ]);
        queryClient.invalidateQueries(API_ENDPOINTS.SHOPS);
        queryClient.invalidateQueries(API_ENDPOINTS.MY_SHOPS);
      },
    },
  );
};
