import { useQuery } from 'react-query';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import { mapPaginatorData } from '@/utils/data-mappers';
import {
  OrderQueryOptions,
  OrderPaginator,
  Order,
  InvoiceTranslatedText,
  CreateOrderInput,
} from '@/types';
import { orderClient } from './client/order';
import { useRouter } from 'next/router';
import { Routes } from '@/config/routes';
import { getApiErrorMessage } from '@/data/client/http-client';

export const useOrdersQuery = (
  params: Partial<OrderQueryOptions>,
  options: any = {}
) => {
  const { data, error, isLoading } = useQuery<OrderPaginator, Error>(
    [API_ENDPOINTS.ORDERS, params],
    ({ queryKey, pageParam }) =>
      orderClient.paginated(Object.assign({}, queryKey[1], pageParam)),
    {
      keepPreviousData: true,
      ...options,
    }
  );
  return {
    orders: data?.data ?? [],
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  };
};

export const useOrderQuery = ({
  id,
  language,
  options,
}: {
  id: string;
  language: string;
  options?: Record<string, unknown>;
}) => {
  const { data, error, isLoading, refetch } = useQuery<Order, Error>(
    [API_ENDPOINTS.ORDERS, { id, language }],
    () => orderClient.get({ id, language }),
    {
      enabled: Boolean(id),
      ...options,
    },
  );

  return {
    order: data,
    error,
    isLoading,
    refetch,
  };
};

// export const useCreateOrderMutation = () => {
//   return useMutation(orderClient.create);
// };

export function useCreateOrderMutation() {
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation();

  const { mutate: createOrder, isLoading } = useMutation(orderClient.create, {
    onSuccess: (data: any) => {
      if (data?.id) {
        router.push(`${Routes.order.list}/${data?.id}`);
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  function formatOrderInput(input: CreateOrderInput) {
    const formattedInputs = {
      ...input,
      language: locale,
      // TODO: Make it for Graphql too
      invoice_translated_text: {
        subtotal: t('order-sub-total'),
        discount: t('order-discount'),
        tax: t('order-tax'),
        delivery_fee: t('order-delivery-fee'),
        total: t('order-total'),
        products: t('text-products'),
        quantity: t('text-quantity'),
        invoice_no: t('text-invoice-no'),
        date: t('text-date'),
      },
    };
    createOrder(formattedInputs);
  }

  return {
    createOrder: formatOrderInput,
    isLoading,
  };
}

export const useUpdateOrderMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(orderClient.update, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.ORDERS);
    },
  });
};

export const useDownloadInvoiceMutation = (
  {
    order_id,
    isRTL,
    language,
  }: { order_id: string; isRTL: boolean; language: string },
  options: any = {}
) => {
  const { t } = useTranslation();
  const formattedInput = {
    order_id,
    is_rtl: isRTL,
    language,
    translated_text: {
      subtotal: t('order-sub-total'),
      discount: t('order-discount'),
      tax: t('order-tax'),
      delivery_fee: t('order-delivery-fee'),
      total: t('order-total'),
      products: t('text-products'),
      quantity: t('text-quantity'),
      invoice_no: t('text-invoice-no'),
      date: t('text-date'),
      paid_from_wallet: t('text-paid_from_wallet'),
      amount_due: t('text-amount-due'),
    },
  };

  return useQuery<string, Error>(
    [API_ENDPOINTS.ORDER_INVOICE_DOWNLOAD],
    () => orderClient.downloadInvoice(formattedInput),
    {
      ...options,
    }
  );
};

export function useOrderSeen() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  const {
    mutate: readOrderNotice,
    isLoading,
    isSuccess,
  } = useMutation(orderClient.orderSeen, {
    onSuccess: () => {},
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.ORDER_SEEN);
    },
  });

  return { readOrderNotice, isLoading, isSuccess };
}

export const useMarkProductLinesReadyMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(
    ({
      id,
      order_item_ids,
    }: {
      id: string;
      order_item_ids?: string[];
    }) => orderClient.markProductLinesReady(id, { order_item_ids }),
    {
      onSuccess: () => toast.success(t('common:successfully-updated')),
      onError: (error) => toast.error(getApiErrorMessage(error)),
      onSettled: () => queryClient.invalidateQueries(API_ENDPOINTS.ORDERS),
    },
  );
};

export const useConfirmProductPickupMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(
    ({
      id,
      itemId,
      quantity,
    }: {
      id: string;
      itemId: string;
      quantity?: number;
    }) => orderClient.confirmProductPickup(id, itemId, { quantity }),
    {
      onSuccess: () => toast.success(t('common:successfully-updated')),
      onError: (error) => toast.error(getApiErrorMessage(error)),
      onSettled: () => queryClient.invalidateQueries(API_ENDPOINTS.ORDERS),
    },
  );
};

export const useUnableToFulfillProductLineMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(
    ({
      id,
      itemId,
      reason,
    }: {
      id: string;
      itemId: string;
      reason: string;
    }) => orderClient.unableToFulfillProductLine(id, itemId, { reason }),
    {
      onSuccess: () => toast.success(t('common:successfully-updated')),
      onError: (error) => toast.error(getApiErrorMessage(error)),
      onSettled: () => queryClient.invalidateQueries(API_ENDPOINTS.ORDERS),
    },
  );
};

export const useCompleteServiceBookingMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(
    ({ id }: { id: string }) => orderClient.completeServiceBooking(id),
    {
      onSuccess: () => toast.success(t('common:successfully-updated')),
      onError: (error) => toast.error(getApiErrorMessage(error)),
      onSettled: () => queryClient.invalidateQueries(API_ENDPOINTS.ORDERS),
    },
  );
};

export const useUnableToFulfillServiceBookingMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      orderClient.unableToFulfillServiceBooking(id, { reason }),
    {
      onSuccess: () => toast.success(t('common:successfully-updated')),
      onError: (error) => toast.error(getApiErrorMessage(error)),
      onSettled: () => queryClient.invalidateQueries(API_ENDPOINTS.ORDERS),
    },
  );
};

export const useCloseOrderMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation(({ id }: { id: string }) => orderClient.closeOrder(id), {
    onSuccess: () => toast.success(t('common:successfully-updated')),
    onError: (error) => toast.error(getApiErrorMessage(error)),
    onSettled: () => queryClient.invalidateQueries(API_ENDPOINTS.ORDERS),
  });
};
