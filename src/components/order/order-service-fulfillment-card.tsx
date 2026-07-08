import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import OrderFulfillmentPanel from '@/components/order/order-fulfillment-panel';
import Badge from '@/components/ui/badge/badge';
import { Table } from '@/components/ui/table';
import { NoDataFound } from '@/components/icons/no-data-found';
import { useIsRTL } from '@/utils/locals';
import usePrice from '@/utils/use-price';
import { Order, ServiceFulfillmentItem } from '@/types';
import {
  useCompleteServiceBookingMutation,
  useUnableToFulfillServiceBookingMutation,
} from '@/data/order';
import {
  canCompleteService,
  canUnableToFulfillService,
  getFulfillmentStatusBadgeColor,
  getServiceStatusLabelKey,
} from '@/utils/order-fulfillment';
import UnableToFulfillModal from '@/components/order/unable-to-fulfill-modal';

type OrderServiceFulfillmentCardProps = {
  order: Order;
};

function ServiceItemPrice({ amount }: { amount: number }) {
  const { price } = usePrice({ amount });
  return <span>{price}</span>;
}

export default function OrderServiceFulfillmentCard({
  order,
}: OrderServiceFulfillmentCardProps) {
  const { t } = useTranslation();
  const { alignLeft, alignRight } = useIsRTL();
  const [showUnableModal, setShowUnableModal] = useState(false);
  const booking = order.service_fulfillment!;
  const items = booking.items ?? [];

  const { mutate: completeService, isLoading: completing } =
    useCompleteServiceBookingMutation();
  const { mutate: unableToFulfill, isLoading: markingUnable } =
    useUnableToFulfillServiceBookingMutation();

  function handleCompleteService() {
    completeService({ id: order.id });
  }

  function handleUnableToFulfill(reason: string) {
    unableToFulfill(
      { id: order.id, reason },
      {
        onSuccess: () => setShowUnableModal(false),
      },
    );
  }

  const columns = [
    {
      title: t('table:table-item-products'),
      dataIndex: 'service_offering',
      key: 'name',
      align: alignLeft,
      render: (
        offering: ServiceFulfillmentItem['service_offering'],
        item: ServiceFulfillmentItem,
      ) => (
        <span className="font-medium text-heading">
          {offering?.name ?? item.id}
        </span>
      ),
    },
    {
      title: t('table:table-item-quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      align: alignRight,
    },
    {
      title: t('table:table-item-total'),
      dataIndex: 'total_price',
      key: 'total_price',
      align: alignRight,
      render: (totalPrice: number) => <ServiceItemPrice amount={totalPrice} />,
    },
  ];

  return (
    <>
      <OrderFulfillmentPanel
        title={t('common:text-service-track')}
        meta={
          <div className="flex flex-wrap items-center gap-3 text-sm text-body">
            {booking.booking_number ? (
              <span>
                <span className="font-semibold text-heading">
                  {t('common:text-booking-number')}:{' '}
                </span>
                {booking.booking_number}
              </span>
            ) : null}
            <Badge
              text={t(getServiceStatusLabelKey(booking.status))}
              color={getFulfillmentStatusBadgeColor(
                booking.status === 'completed'
                  ? 'picked_up'
                  : booking.status === 'pending'
                    ? 'preparing'
                    : booking.status,
              )}
            />
          </div>
        }
        toolbar={
          <>
            {canCompleteService(order) ? (
              <Button
                size="small"
                loading={completing}
                onClick={handleCompleteService}
              >
                {t('form:button-mark-service-complete')}
              </Button>
            ) : null}
            {canUnableToFulfillService(order) ? (
              <Button
                size="small"
                variant="outline"
                onClick={() => setShowUnableModal(true)}
              >
                {t('form:button-unable-to-fulfill')}
              </Button>
            ) : null}
          </>
        }
      >
        <Table
          //@ts-ignore
          columns={columns}
          data={items}
          rowKey="id"
          scroll={{ x: 500 }}
          emptyText={() => (
            <div className="flex flex-col items-center py-7">
              <NoDataFound className="w-52" />
              <div className="mb-1 pt-6 text-base font-semibold text-heading">
                {t('table:empty-table-data')}
              </div>
            </div>
          )}
        />
      </OrderFulfillmentPanel>

      <UnableToFulfillModal
        open={showUnableModal}
        onClose={() => setShowUnableModal(false)}
        onConfirm={handleUnableToFulfill}
        isLoading={markingUnable}
      />
    </>
  );
}
