import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Order } from '@/types';
import { useCloseOrderMutation } from '@/data/order';
import {
  canCloseOrder,
  getCloseOrderDisabledReason,
} from '@/utils/order-fulfillment';

type OrderCloseButtonProps = {
  order: Order;
};

export default function OrderCloseButton({ order }: OrderCloseButtonProps) {
  const { t } = useTranslation();
  const { mutate: closeOrder, isLoading } = useCloseOrderMutation();
  const canClose = canCloseOrder(order);
  const disabledReason = getCloseOrderDisabledReason(order);

  function handleCloseOrder() {
    if (!canClose) {
      return;
    }
    closeOrder({ id: order.id });
  }

  const button = (
    <Button
      loading={isLoading}
      disabled={!canClose}
      onClick={handleCloseOrder}
      className="w-full sm:w-auto"
    >
      {t('form:button-close-order')}
    </Button>
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-200 border-t-4 border-t-accent bg-light px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-body">
        {canClose
          ? t('common:text-close-order-ready')
          : disabledReason
            ? t(`common:${disabledReason}`)
            : t('common:text-close-order-not-ready')}
      </p>
      {!canClose && disabledReason ? (
        <Tooltip content={disabledReason}>
          <span className="inline-flex sm:ms-auto">{button}</span>
        </Tooltip>
      ) : (
        <span className="sm:ms-auto">{button}</span>
      )}
    </div>
  );
}
