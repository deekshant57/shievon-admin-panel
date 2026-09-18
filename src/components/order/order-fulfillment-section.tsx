import { Order } from '@/types';
import OrderSelfPickupProgress from '@/components/order/order-self-pickup-progress';
import OrderDeliveryProgress from '@/components/order/order-delivery-progress';
import OrderServiceProgress from '@/components/order/order-service-progress';
import OrderProductFulfillmentCard from '@/components/order/order-product-fulfillment-card';
import OrderServiceFulfillmentCard from '@/components/order/order-service-fulfillment-card';
import OrderDeliveryPanel from '@/components/order/order-delivery-panel';
import OrderCloseButton from '@/components/order/order-close-button';
import {
  isAppointmentOnlyOrder,
  isDeliveryOrder,
  showProductFulfillmentCard,
  showServiceFulfillmentCard,
  shouldShowCloseOrder,
} from '@/utils/order-fulfillment';

type OrderFulfillmentSectionProps = {
  order: Order;
  refetchOrder?: () => void;
};

export default function OrderFulfillmentSection({
  order,
  refetchOrder,
}: OrderFulfillmentSectionProps) {
  const showProductCard = showProductFulfillmentCard(order);
  const showServiceCard = showServiceFulfillmentCard(order);
  const isDelivery = isDeliveryOrder(order);
  const isAppointmentOnly = isAppointmentOnlyOrder(order);

  return (
    <div className="mb-8 rounded-xl border border-border-200 bg-gray-50/60 p-4 md:p-6">
      <div className="mb-6 w-full min-w-0 overflow-hidden rounded-lg border border-border-200 bg-light px-3 py-4 sm:px-4 sm:py-5 md:px-5 md:py-8">
        {isAppointmentOnly ? (
          <OrderServiceProgress order={order} />
        ) : isDelivery ? (
          <OrderDeliveryProgress order={order} />
        ) : (
          <OrderSelfPickupProgress order={order} />
        )}
      </div>

      {isDelivery && !isAppointmentOnly ? (
        <OrderDeliveryPanel order={order} refetchOrder={refetchOrder} />
      ) : null}

      {showProductCard ? (
        <OrderProductFulfillmentCard order={order} />
      ) : null}
      {showServiceCard ? (
        <OrderServiceFulfillmentCard order={order} />
      ) : null}

      {shouldShowCloseOrder(order) ? <OrderCloseButton order={order} /> : null}
    </div>
  );
}
