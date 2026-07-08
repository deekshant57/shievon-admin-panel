import { Order } from '@/types';
import OrderSelfPickupProgress from '@/components/order/order-self-pickup-progress';
import OrderProductFulfillmentCard from '@/components/order/order-product-fulfillment-card';
import OrderServiceFulfillmentCard from '@/components/order/order-service-fulfillment-card';
import OrderCloseButton from '@/components/order/order-close-button';
import {
  showProductFulfillmentCard,
  showServiceFulfillmentCard,
} from '@/utils/order-fulfillment';

type OrderFulfillmentSectionProps = {
  order: Order;
};

export default function OrderFulfillmentSection({
  order,
}: OrderFulfillmentSectionProps) {
  const showProductCard = showProductFulfillmentCard(order);
  const showServiceCard = showServiceFulfillmentCard(order);

  return (
    <div className="mb-8 rounded-xl border border-border-200 bg-gray-50/60 p-4 md:p-6">
      <div className="mb-6 flex items-center justify-center rounded-lg border border-border-200 bg-light px-4 py-5 md:py-8">
        <OrderSelfPickupProgress order={order} />
      </div>

      {showProductCard ? (
        <OrderProductFulfillmentCard order={order} />
      ) : null}
      {showServiceCard ? (
        <OrderServiceFulfillmentCard order={order} />
      ) : null}

      <OrderCloseButton order={order} />
    </div>
  );
}
