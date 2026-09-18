import { useTranslation } from 'next-i18next';
import { format } from 'date-fns';
import { Order } from '@/types';
import cn from 'classnames';
import StatusColor from '@/components/order/status-color';
import Badge from '@/components/ui/badge/badge';
import {
  hasFulfillmentFlow,
  getFulfillmentModeBadge,
  isAppointmentOnlyOrder,
  isAwaitingPayment,
  isDeliveryOrder,
} from '@/utils/order-fulfillment';

interface OrderViewHeaderProps {
  order: Order;
  wrapperClassName?: string;
  buttonSize?: 'big' | 'medium' | 'small';
}

function formatPickupDate(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return format(new Date(value), 'MMMM d, yyyy h:mm a');
  } catch {
    return value;
  }
}

export default function OrderViewHeader({
  order,
  wrapperClassName = 'px-11 py-5',
}: OrderViewHeaderProps) {
  const { t } = useTranslation('common');
  const showFulfillmentMeta = hasFulfillmentFlow(order);
  const fulfillmentModeBadge = getFulfillmentModeBadge(order);
  const showPickupTiming =
    showFulfillmentMeta &&
    !isDeliveryOrder(order) &&
    !isAppointmentOnlyOrder(order);
  const pickupAvailableAt = showPickupTiming
    ? formatPickupDate(order.pickup_available_at)
    : null;
  const preferredPickupTime = showPickupTiming
    ? formatPickupDate(order.preferred_pickup_time)
    : null;
  // Prefer BE label; unpaid fallback only if label missing during rollout.
  const customerStatusLabel =
    order.customer_status_label ||
    (isAwaitingPayment(order) ? t('payment-pending') : null);

  return (
    <div className={cn('rounded-t-xl bg-gray-50', wrapperClassName)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {showFulfillmentMeta ? (
          <div className="min-w-0">
            <div className="text-sm font-semibold text-body">
              {t('text-invoice-no')}
            </div>
            <div className="text-2xl font-bold tracking-tight text-heading">
              {order.tracking_number}
            </div>
            {fulfillmentModeBadge ? (
              <Badge
                text={t(fulfillmentModeBadge.label)}
                color={fulfillmentModeBadge.color}
                className="mt-2"
              />
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            'flex w-full flex-wrap gap-4 lg:gap-6',
            showFulfillmentMeta ? 'lg:justify-end' : 'justify-between',
          )}
        >
          <div>
            <span className="mb-2 block text-sm font-semibold text-body lg:mb-0 lg:inline-block lg:ltr:mr-4 lg:rtl:ml-4">
              {t('text-order-status')} :
            </span>
            <Badge
              text={t(order?.order_status)}
              color={StatusColor(order?.order_status)}
            />
          </div>
          <div>
            <span className="mb-2 block text-sm font-semibold text-body lg:mb-0 lg:inline-block lg:ltr:mr-4 lg:rtl:ml-4">
              {t('text-payment-status')} :
            </span>
            <Badge
              text={t(order?.payment_status)}
              color={StatusColor(order?.payment_status)}
            />
          </div>
          {customerStatusLabel ? (
            <div>
              <span className="mb-2 block text-sm font-semibold text-body lg:mb-0 lg:inline-block lg:ltr:mr-4 lg:rtl:ml-4">
                {t('text-customer-status')} :
              </span>
              <Badge text={customerStatusLabel} />
            </div>
          ) : null}
        </div>
      </div>

      {showPickupTiming && (pickupAvailableAt || preferredPickupTime) ? (
        <div className="mt-4 grid gap-2 border-t border-border-200 pt-4 text-sm text-body sm:grid-cols-2">
          {pickupAvailableAt ? (
            <p>
              <span className="font-semibold text-heading">
                {t('text-pickup-available-after')}:{' '}
              </span>
              {pickupAvailableAt}
              {order.can_show_ready_for_pickup === false ? (
                <span className="ms-2 text-xs text-body">
                  ({t('text-preparing')})
                </span>
              ) : null}
            </p>
          ) : null}
          {preferredPickupTime ? (
            <p>
              <span className="font-semibold text-heading">
                {t('text-preferred-pickup-time')}:{' '}
              </span>
              {preferredPickupTime}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
