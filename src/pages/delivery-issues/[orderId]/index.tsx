import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import Button from '@/components/ui/button';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { adminOnly } from '@/utils/auth-utils';
import { useRouter } from 'next/router';
import { Routes } from '@/config/routes';
import {
  useCancelDeliveryIssueOrderMutation,
  useDeliveryIssueQuery,
  useRetryDeliveryDispatchMutation,
} from '@/data/delivery-issues';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function DeliveryIssueDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const orderId = router.query.orderId as string | undefined;
  const [cancelReason, setCancelReason] = useState('');

  const { data: order, isLoading, error } = useDeliveryIssueQuery(orderId);
  const { mutate: retryDispatch, isLoading: retrying } =
    useRetryDeliveryDispatchMutation();
  const { mutate: cancelOrder, isLoading: cancelling } =
    useCancelDeliveryIssueOrderMutation();

  if (isLoading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!order) return <ErrorMessage message="Order not found" />;

  const delivery = order.deliveries?.[0];
  const shipmentStatus = delivery?.shipment_status ?? '—';
  const canRetry = ['aborted', 'cancelled', 'fallback_pickup'].includes(
    String(shipmentStatus).toLowerCase(),
  );

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(Routes.deliveryIssues.list)}
        >
          Back to list
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(Routes.order.details(order.id))}
        >
          Open order
        </Button>
      </div>

      <DataPanel title={`Order #${order.tracking_number}`}>
        <div className="space-y-6 p-5 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-gray-500">Order status</p>
              <p className="font-medium">{order.order_status}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Customer label</p>
              <p className="font-medium">
                {order.customer_status_label ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Shipment status</p>
              <p className="font-medium">{shipmentStatus}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Partner status</p>
              <p className="font-medium">{delivery?.partner_status ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Customer</p>
              <p className="font-medium">{order.customer?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Updated</p>
              <p className="font-medium">
                {order.updated_at
                  ? dayjs(order.updated_at).format('MMM DD, YYYY hh:mm A')
                  : '—'}
              </p>
            </div>
          </div>

          {order.items?.length ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold">Line items</h3>
              <ul className="divide-y rounded border">
                {order.items.map((item: any) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <span>{item.name ?? item.product?.name ?? item.id}</span>
                    <span className="text-gray-600">
                      {item.fulfillment_status ?? item.fulfillmentStatus ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t pt-6">
            <Button
              disabled={!canRetry || retrying}
              loading={retrying}
              onClick={() => {
                if (
                  window.confirm(
                    'Re-schedule Dropit dispatch for this order?',
                  )
                ) {
                  retryDispatch(order.id);
                }
              }}
            >
              Retry dispatch
            </Button>
            <div className="flex flex-1 flex-wrap items-end gap-2">
              <div className="min-w-[240px] flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Cancel reason (optional)
                </label>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation"
                />
              </div>
              <Button
                variant="outline"
                className="border-red-500 text-red-600"
                disabled={cancelling}
                loading={cancelling}
                onClick={() => {
                  if (
                    window.confirm(
                      'Cancel this order and process refund if applicable?',
                    )
                  ) {
                    cancelOrder({ orderId: order.id, reason: cancelReason });
                  }
                }}
              >
                Cancel order
              </Button>
            </div>
          </div>
        </div>
      </DataPanel>
    </div>
  );
}

DeliveryIssueDetailPage.authenticate = {
  permissions: adminOnly,
};
DeliveryIssueDetailPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common', 'form', 'table'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"orderId":"__gh"} }], fallback: false };
}
