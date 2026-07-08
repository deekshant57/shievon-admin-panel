import {
  Order,
  OrderStatus,
  ProductFulfillmentLine,
} from '@/types';

export function hasFulfillmentFlow(order?: Order | null): boolean {
  return Boolean(order?.paid_at);
}

export function isSelfPickupOrder(order?: Order | null): boolean {
  return Boolean(
    order?.paid_at && (order.product_fulfillment?.lines?.length ?? 0) > 0,
  );
}

export function showProductFulfillmentCard(order?: Order | null): boolean {
  return Boolean(
    order?.paid_at && (order.product_fulfillment?.lines?.length ?? 0) > 0,
  );
}

export function showServiceFulfillmentCard(order?: Order | null): boolean {
  return Boolean(order?.paid_at && order?.service_fulfillment?.booking_id);
}

export function getRemainingPickupQty(line: ProductFulfillmentLine): number {
  return Math.max(0, (line.quantity ?? 0) - (line.picked_up_quantity ?? 0));
}

export function canMarkLineReady(line: ProductFulfillmentLine): boolean {
  if (line.line_status === 'cancelled') {
    return false;
  }
  const status = line.fulfillment_status;
  return status !== 'picked_up' && status !== 'unable_to_fulfill';
}

export function canMarkProductLinesReady(order: Order): boolean {
  if (
    !['order-processing', 'order-ready-for-pickup'].includes(order.order_status)
  ) {
    return false;
  }
  return (order.product_fulfillment?.lines ?? []).some((line) =>
    canMarkLineReady(line),
  );
}

export function canConfirmPickup(line: ProductFulfillmentLine): boolean {
  return (
    line.fulfillment_status === 'ready_for_pickup' &&
    getRemainingPickupQty(line) > 0
  );
}

export function canUnableToFulfillProduct(line: ProductFulfillmentLine): boolean {
  if (line.line_status === 'cancelled') {
    return false;
  }
  const status = line.fulfillment_status;
  return status !== 'picked_up' && status !== 'unable_to_fulfill';
}

export function isProductLineTerminal(line: ProductFulfillmentLine): boolean {
  if (line.line_status === 'cancelled') {
    return true;
  }
  const status = line.fulfillment_status;
  return status === 'picked_up' || status === 'unable_to_fulfill';
}

export function canCloseOrder(order: Order): boolean {
  if (
    !['order-processing', 'order-ready-for-pickup'].includes(order.order_status)
  ) {
    return false;
  }

  const productLines = (order.product_fulfillment?.lines ?? []).filter(
    (line) => line.line_status !== 'cancelled',
  );
  const hasProductLines = productLines.length > 0;
  const productsTerminal =
    !hasProductLines || productLines.every((line) => isProductLineTerminal(line));

  const serviceFulfillment = order.service_fulfillment;
  const hasServiceBooking = Boolean(serviceFulfillment?.booking_id);
  const serviceTerminal =
    !hasServiceBooking ||
    ['completed', 'unable_to_fulfill', 'cancelled'].includes(
      serviceFulfillment?.status ?? '',
    );

  return productsTerminal && serviceTerminal;
}

export function getFulfillmentStatusLabelKey(
  status?: string | null,
): string {
  switch (status) {
    case 'preparing':
      return 'text-preparing';
    case 'ready_for_pickup':
      return 'order-ready-for-pickup';
    case 'picked_up':
      return 'text-picked-up';
    case 'unable_to_fulfill':
      return 'text-unable-to-fulfill';
    default:
      return status ?? 'text-fulfillment-status';
  }
}

export function getFulfillmentStatusBadgeColor(
  status?: string | null,
): string {
  switch (status) {
    case 'preparing':
      return 'bg-status-processing bg-opacity-10 text-status-processing';
    case 'ready_for_pickup':
      return 'bg-accent bg-opacity-10 !text-accent';
    case 'picked_up':
      return 'bg-status-complete bg-opacity-10 text-status-complete';
    case 'unable_to_fulfill':
      return 'bg-status-canceled bg-opacity-10 text-status-canceled';
    default:
      return 'bg-accent bg-opacity-10 !text-accent';
  }
}

export function getProductNameForLine(order: Order, lineId: string): string {
  const item = order.items?.find((entry) => entry.id === lineId);
  if (item?.name) {
    return item.name;
  }

  const product = order.products?.find((entry) => entry.id === lineId);
  if (product?.name) {
    return product.name;
  }

  return lineId;
}

export function getActiveProductFulfillmentLines(
  order: Order,
): ProductFulfillmentLine[] {
  return (order.product_fulfillment?.lines ?? []).filter(
    (line) => line.line_status !== 'cancelled' && line.item_kind !== 'service',
  );
}

export function isServiceBookingTerminal(status?: string | null): boolean {
  return ['completed', 'unable_to_fulfill', 'cancelled'].includes(status ?? '');
}

export function canCompleteService(order: Order): boolean {
  const booking = order.service_fulfillment;
  if (!booking?.booking_id) {
    return false;
  }
  return !isServiceBookingTerminal(booking.status);
}

export function canUnableToFulfillService(order: Order): boolean {
  return canCompleteService(order);
}

export function getServiceStatusLabelKey(status?: string | null): string {
  switch (status) {
    case 'pending':
      return 'text-preparing';
    case 'completed':
      return 'text-service-completed';
    case 'unable_to_fulfill':
      return 'text-unable-to-fulfill';
    case 'cancelled':
      return 'order-cancelled';
    default:
      return status ?? 'text-fulfillment-status';
  }
}

export const SELF_PICKUP_PROGRESS_STEPS = [
  { name: 'text-self-pickup-confirmed', status: 'confirmed', serial: 1 },
  { name: 'text-preparing', status: 'preparing', serial: 2 },
  {
    name: 'text-order-ready-for-pickup',
    status: 'ready-for-pickup',
    serial: 3,
  },
  { name: 'text-picked-up', status: 'picked-up', serial: 4 },
  { name: 'text-order-closed', status: 'closed', serial: 5 },
];

export function getSelfPickupProgressIndex(order: Order): number {
  const status = order.order_status;

  if (
    status === OrderStatus.COMPLETED ||
    status === OrderStatus.CANCELLED
  ) {
    return 4;
  }

  const productLines = getActiveProductFulfillmentLines(order);
  const hasProducts = productLines.length > 0;
  const allProductsTerminal =
    !hasProducts || productLines.every((line) => isProductLineTerminal(line));

  const service = order.service_fulfillment;
  const hasService = Boolean(service?.booking_id);
  const serviceTerminal =
    !hasService || isServiceBookingTerminal(service?.status);

  if (allProductsTerminal && serviceTerminal) {
    return 3;
  }

  if (
    status === OrderStatus.READY_FOR_PICKUP ||
    productLines.some((line) => line.fulfillment_status === 'ready_for_pickup')
  ) {
    return 2;
  }

  if (
    productLines.some(
      (line) =>
        line.fulfillment_status === 'preparing' || !line.fulfillment_status,
    ) ||
    (hasService && service?.status === 'pending')
  ) {
    return 1;
  }

  if (order.paid_at) {
    return 0;
  }

  return 0;
}

export function getCloseOrderDisabledReason(order: Order): string | null {
  if (canCloseOrder(order)) {
    return null;
  }

  if (
    !['order-processing', 'order-ready-for-pickup'].includes(order.order_status)
  ) {
    return 'text-close-order-wrong-status';
  }

  const productLines = getActiveProductFulfillmentLines(order);
  const hasProducts = productLines.length > 0;
  const allProductsTerminal =
    !hasProducts || productLines.every((line) => isProductLineTerminal(line));

  if (hasProducts && !allProductsTerminal) {
    return 'text-close-order-products-pending';
  }

  const service = order.service_fulfillment;
  if (
    service?.booking_id &&
    !isServiceBookingTerminal(service.status)
  ) {
    return 'text-close-order-service-pending';
  }

  return 'text-close-order-not-ready';
}

export function getFulfillmentAdminStatusOptions() {
  return [
    'order-pending',
    'order-processing',
    'order-ready-for-pickup',
    'order-completed',
    'order-cancelled',
  ];
}

export function getListFulfillmentBadge(order: Order): {
  label: string;
  color: string;
  translate?: boolean;
} | null {
  if (order.customer_status_label) {
    return {
      label: order.customer_status_label,
      color: getListFulfillmentBadgeColor(order),
    };
  }

  if (!hasFulfillmentFlow(order)) {
    return null;
  }

  if (order.order_status === OrderStatus.READY_FOR_PICKUP) {
    return {
      label: 'order-ready-for-pickup',
      color: 'bg-accent bg-opacity-10 !text-accent',
      translate: true,
    };
  }

  return null;
}

function getListFulfillmentBadgeColor(order: Order): string {
  if (order.order_status === OrderStatus.READY_FOR_PICKUP) {
    return 'bg-accent bg-opacity-10 !text-accent';
  }
  if (order.order_status === OrderStatus.COMPLETED) {
    return 'bg-status-complete bg-opacity-10 text-status-complete';
  }
  return 'bg-status-processing bg-opacity-10 text-status-processing';
}
