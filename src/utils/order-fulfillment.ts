import {
  Order,
  OrderDelivery,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  ProductFulfillmentLine,
} from '@/types';

export function hasFulfillmentFlow(order?: Order | null): boolean {
  return Boolean(order?.paid_at);
}

export function isDeliveryOrder(order?: Order | null): boolean {
  return order?.fulfillment_mode === 'delivery';
}

export function isPickupOrder(order?: Order | null): boolean {
  if (!order?.paid_at) {
    return false;
  }
  return !isDeliveryOrder(order);
}

/** Goods track line (products + cafe). Prefer capability over item_kind. */
export function isGoodsFulfillmentLine(
  line?: Pick<ProductFulfillmentLine, 'item_kind' | 'fulfillment_capability'> | null,
): boolean {
  if (!line) {
    return false;
  }
  // Appointment lines do not belong on the goods track.
  if (line.fulfillment_capability === 'appointment') {
    return false;
  }
  if (line.fulfillment_capability === 'delivery' || line.item_kind === 'product') {
    return true;
  }
  // Legacy cafe/product rows in product_fulfillment without capability yet.
  return true;
}

export function isDeliveryCapableLine(
  line?: Pick<ProductFulfillmentLine, 'item_kind' | 'fulfillment_capability'> | null,
): boolean {
  if (!line) {
    return false;
  }
  return (
    line.fulfillment_capability === 'delivery' || line.item_kind === 'product'
  );
}

export function isAppointmentItem(
  item?: Pick<OrderItem, 'fulfillment_capability'> | null,
): boolean {
  return item?.fulfillment_capability === 'appointment';
}

export function hasAppointmentItems(order?: Order | null): boolean {
  return (order?.items ?? []).some((item) => isAppointmentItem(item));
}

/**
 * Appointment-only (salon): no goods lines; booking UI only.
 * Replaces guessing from item_kind === 'service'.
 */
export function isAppointmentOnlyOrder(order?: Order | null): boolean {
  if (!order) {
    return false;
  }
  if (getActiveProductFulfillmentLines(order).length > 0) {
    return false;
  }
  return (
    hasAppointmentItems(order) || Boolean(order.service_fulfillment?.booking_id)
  );
}

/** @deprecated Use isAppointmentOnlyOrder — kept for call-site compatibility during rollout. */
export function isServiceOnlyOrder(order?: Order | null): boolean {
  return isAppointmentOnlyOrder(order);
}

/**
 * Cafe/products-only: ignore service_fulfillment even if a legacy booking exists.
 */
export function shouldIgnoreServiceFulfillment(order?: Order | null): boolean {
  if (!order || hasAppointmentItems(order)) {
    return false;
  }
  const goods = order.product_fulfillment?.lines ?? [];
  if (goods.length === 0) {
    return false;
  }
  return goods.every((line) => isDeliveryCapableLine(line));
}

export function isAwaitingPayment(order?: Order | null): boolean {
  if (!order || order.paid_at) {
    return false;
  }
  return (
    order.payment_status === PaymentStatus.PENDING ||
    order.payment_status === PaymentStatus.PROCESSING
  );
}

export function getPrimaryDelivery(order?: Order | null): OrderDelivery | null {
  return order?.deliveries?.[0] ?? null;
}

export function shouldPollDeliveryTracking(
  delivery?: OrderDelivery | null,
): boolean {
  const status = delivery?.shipment_status;
  return status === 'accepted' || status === 'in_progress';
}

/** Vendor live map is for pickup only — rider heading to the shop. */
export function shouldShowVendorPickupTracking(
  delivery?: OrderDelivery | null,
): boolean {
  if (!delivery?.pilot_location) {
    return false;
  }
  return delivery.shipment_status === 'accepted';
}

/**
 * Delivery terminal failure (retries exhausted / line failed / legacy fallback).
 * Not customer cancel. fallback_pickup is treated as Delivery issue — not pickup UX.
 */
export function isDeliveryFailed(order?: Order | null): boolean {
  if (isDeliveryCancelled(order)) {
    return false;
  }

  const delivery = getPrimaryDelivery(order);
  if (
    delivery?.shipment_status === 'aborted' ||
    delivery?.shipment_status === 'fallback_pickup'
  ) {
    return true;
  }

  return getActiveProductFulfillmentLines(order).some(
    (line) => line.fulfillment_status === 'delivery_failed',
  );
}

/** Customer/admin cancel (or shipment cancelled with the order). */
export function isDeliveryCancelled(order?: Order | null): boolean {
  if (order?.order_status === OrderStatus.CANCELLED) {
    return true;
  }
  return getPrimaryDelivery(order)?.shipment_status === 'cancelled';
}

/** @deprecated Prefer isDeliveryFailed — fallback is a terminal delivery issue. */
export function isDeliveryFallbackPickup(order?: Order | null): boolean {
  return getPrimaryDelivery(order)?.shipment_status === 'fallback_pickup';
}

export function isOrderOpenForFulfillmentActions(order?: Order | null): boolean {
  if (!order?.order_status) {
    return false;
  }
  if (isAwaitingPayment(order) || !order.paid_at) {
    return false;
  }
  return ![
    OrderStatus.CANCELLED,
    OrderStatus.COMPLETED,
    OrderStatus.FAILED,
    OrderStatus.REFUNDED,
  ].includes(order.order_status as OrderStatus);
}

/** Pickup (product/cafe) can close; delivery orders never vendor-close (incl. fallback). */
export function shouldShowCloseOrder(order: Order): boolean {
  if (!hasFulfillmentFlow(order)) {
    return false;
  }

  if (isDeliveryOrder(order)) {
    return false;
  }

  if (isAppointmentOnlyOrder(order)) {
    return true;
  }

  return getActiveProductFulfillmentLines(order).length > 0;
}

export function isSelfPickupOrder(order?: Order | null): boolean {
  return Boolean(
    order?.paid_at &&
      !isDeliveryOrder(order) &&
      getActiveProductFulfillmentLines(order).length > 0,
  );
}

export function showProductFulfillmentCard(order?: Order | null): boolean {
  return Boolean(
    order?.paid_at && getActiveProductFulfillmentLines(order).length > 0,
  );
}

export function showServiceFulfillmentCard(order?: Order | null): boolean {
  if (!order?.paid_at || shouldIgnoreServiceFulfillment(order)) {
    return false;
  }
  return Boolean(order.service_fulfillment?.booking_id);
}

export function getRemainingPickupQty(line: ProductFulfillmentLine): number {
  return Math.max(0, (line.quantity ?? 0) - (line.picked_up_quantity ?? 0));
}

export function canMarkLineReady(
  order: Order,
  line: ProductFulfillmentLine,
): boolean {
  if (!isOrderOpenForFulfillmentActions(order)) {
    return false;
  }
  if (isDeliveryFailed(order)) {
    return false;
  }
  if (line.line_status === 'cancelled') {
    return false;
  }
  const status = line.fulfillment_status;
  const postReadyStatuses = [
    'ready_for_pickup',
    'ready_for_delivery',
    'rider_requested',
    'rider_assigned',
    'out_for_delivery',
    'delivered',
    'delivery_failed',
  ];
  return (
    status !== 'picked_up' &&
    status !== 'unable_to_fulfill' &&
    !postReadyStatuses.includes(status ?? '')
  );
}

export function canMarkProductLinesReady(order: Order): boolean {
  if (isDeliveryFailed(order)) {
    return false;
  }
  if (
    ![
      OrderStatus.PROCESSING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.READY_FOR_DELIVERY,
    ].includes(order.order_status as OrderStatus)
  ) {
    return false;
  }
  return getActiveProductFulfillmentLines(order).some((line) =>
    canMarkLineReady(order, line),
  );
}

export function canConfirmPickup(line: ProductFulfillmentLine): boolean {
  return (
    line.fulfillment_status === 'ready_for_pickup' &&
    getRemainingPickupQty(line) > 0
  );
}

export function canConfirmPickupForOrder(
  order: Order,
  line: ProductFulfillmentLine,
): boolean {
  if (!isOrderOpenForFulfillmentActions(order)) {
    return false;
  }
  // Delivery (incl. failed/fallback) is never vendor pickup-confirm.
  if (isDeliveryOrder(order)) {
    return false;
  }
  return canConfirmPickup(line);
}

export function canUnableToFulfillProduct(
  order: Order,
  line: ProductFulfillmentLine,
): boolean {
  if (!isOrderOpenForFulfillmentActions(order)) {
    return false;
  }
  if (line.line_status === 'cancelled') {
    return false;
  }
  if (isVendorUnableBlockedByDelivery(order)) {
    return false;
  }
  const status = line.fulfillment_status;
  const blockedLineStatuses = [
    'picked_up',
    'unable_to_fulfill',
    'delivered',
    'delivery_failed',
    'out_for_delivery',
  ];
  return !blockedLineStatuses.includes(status ?? '');
}

/** Mirror BE lock: after rider pickup, vendor unable is ops-only. */
export function isVendorUnableBlockedByDelivery(order?: Order | null): boolean {
  if (!isDeliveryOrder(order) || isDeliveryFailed(order)) {
    return false;
  }
  const orderKey = String(order?.order_status ?? '')
    .toLowerCase()
    .replace(/^order-/, '');
  if (orderKey === 'out-for-delivery') {
    return true;
  }
  return getPrimaryDelivery(order)?.shipment_status === 'in_progress';
}

export function isProductLineTerminal(line: ProductFulfillmentLine): boolean {
  if (line.line_status === 'cancelled') {
    return true;
  }
  const status = line.fulfillment_status;
  return (
    status === 'picked_up' ||
    status === 'unable_to_fulfill' ||
    status === 'delivered' ||
    status === 'delivery_failed'
  );
}

function getCloseableOrderStatuses(_order: Order): string[] {
  return ['order-processing', 'order-ready-for-pickup'];
}

export function canCloseOrder(order: Order): boolean {
  if (isDeliveryOrder(order)) {
    return false;
  }

  if (!getCloseableOrderStatuses(order).includes(order.order_status)) {
    return false;
  }

  const productLines = getActiveProductFulfillmentLines(order);
  const hasProductLines = productLines.length > 0;
  const productsTerminal =
    !hasProductLines ||
    productLines.every((line) => isProductLineTerminal(line));

  if (shouldIgnoreServiceFulfillment(order)) {
    return hasProductLines && productsTerminal;
  }

  const serviceFulfillment = order.service_fulfillment;
  const hasServiceBooking = Boolean(serviceFulfillment?.booking_id);
  const serviceTerminal =
    !hasServiceBooking ||
    ['completed', 'unable_to_fulfill', 'cancelled'].includes(
      serviceFulfillment?.status ?? '',
    );

  // Cafe pickup: goods terminal is enough. Salon: booking must be terminal.
  if (hasProductLines) {
    return productsTerminal && serviceTerminal;
  }

  return serviceTerminal && hasServiceBooking;
}

export function getFulfillmentStatusLabelKey(
  status?: string | null,
): string {
  switch (status) {
    case 'preparing':
      return 'text-preparing';
    case 'ready_for_pickup':
      return 'order-ready-for-pickup';
    case 'ready_for_delivery':
      return 'text-ready-for-delivery';
    case 'rider_requested':
      return 'text-rider-requested';
    case 'rider_assigned':
      return 'text-rider-assigned';
    case 'out_for_delivery':
      return 'text-order-out-for-delivery';
    case 'delivered':
      return 'text-delivered';
    case 'delivery_failed':
      return 'text-delivery-issue';
    case 'picked_up':
      return 'text-picked-up';
    case 'unable_to_fulfill':
      return 'text-unable-to-fulfill';
    case 'cancelled':
      return 'order-cancelled';
    default:
      return status ?? 'text-fulfillment-status';
  }
}

export function getShipmentStatusLabelKey(status?: string | null): string {
  switch (status) {
    case 'pending_dispatch':
      return 'text-shipment-pending-dispatch';
    case 'pending':
      return 'text-shipment-pending';
    case 'accepted':
      return 'text-shipment-accepted';
    case 'in_progress':
      return 'text-shipment-in-progress';
    case 'completed':
      return 'text-shipment-completed';
    case 'cancelled':
      return 'text-shipment-cancelled';
    case 'aborted':
      return 'text-delivery-issue';
    case 'fallback_pickup':
      return 'text-delivery-issue';
    default:
      return status ?? 'text-fulfillment-status';
  }
}

export function getShipmentStatusBadgeColor(status?: string | null): string {
  switch (status) {
    case 'pending_dispatch':
    case 'pending':
      return 'bg-status-processing bg-opacity-10 text-status-processing';
    case 'accepted':
    case 'in_progress':
      return 'bg-accent bg-opacity-10 !text-accent';
    case 'completed':
      return 'bg-status-complete bg-opacity-10 text-status-complete';
    case 'cancelled':
    case 'aborted':
    case 'fallback_pickup':
      return 'bg-status-canceled bg-opacity-10 text-status-canceled';
    default:
      return 'bg-accent bg-opacity-10 !text-accent';
  }
}

export function getFulfillmentStatusBadgeColor(
  status?: string | null,
): string {
  switch (status) {
    case 'preparing':
      return 'bg-status-processing bg-opacity-10 text-status-processing';
    case 'ready_for_pickup':
    case 'ready_for_delivery':
      return 'bg-accent bg-opacity-10 !text-accent';
    case 'rider_requested':
    case 'rider_assigned':
    case 'out_for_delivery':
      return 'bg-blue-100 text-blue-800';
    case 'delivered':
    case 'picked_up':
      return 'bg-status-complete bg-opacity-10 text-status-complete';
    case 'delivery_failed':
    case 'unable_to_fulfill':
    case 'cancelled':
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
  if (item?.product?.name) {
    return item.product.name;
  }

  const product = order.products?.find((entry) => entry.id === lineId);
  if (product?.name) {
    return product.name;
  }

  const serviceItem = order.service_fulfillment?.items?.find(
    (entry) => entry.id === lineId,
  );
  if (serviceItem?.service_offering?.name) {
    return serviceItem.service_offering.name;
  }

  return lineId;
}

export function getActiveProductFulfillmentLines(
  order?: Order | null,
): ProductFulfillmentLine[] {
  return (order?.product_fulfillment?.lines ?? []).filter(
    (line) =>
      line.line_status !== 'cancelled' && isGoodsFulfillmentLine(line),
  );
}

/** All goods lines for display (includes cancelled — used for order history). */
export function getProductFulfillmentDisplayLines(
  order?: Order | null,
): ProductFulfillmentLine[] {
  return (order?.product_fulfillment?.lines ?? []).filter((line) =>
    isGoodsFulfillmentLine(line),
  );
}

export function getProductLineDisplayStatus(
  line: ProductFulfillmentLine,
): string | null {
  if (line.line_status === 'cancelled') {
    if (line.fulfillment_status === 'unable_to_fulfill') {
      return 'unable_to_fulfill';
    }
    return 'cancelled';
  }
  return line.fulfillment_status ?? null;
}

export function isServiceBookingTerminal(status?: string | null): boolean {
  return ['completed', 'unable_to_fulfill', 'cancelled'].includes(status ?? '');
}

export function canCompleteService(order: Order): boolean {
  if (!isOrderOpenForFulfillmentActions(order)) {
    return false;
  }
  if (shouldIgnoreServiceFulfillment(order)) {
    return false;
  }
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

export type FulfillmentProgressStep = {
  name: string;
  status: string;
  serial: number;
};

export const DELIVERY_PROGRESS_STEPS: FulfillmentProgressStep[] = [
  { name: 'text-self-pickup-confirmed', status: 'confirmed', serial: 1 },
  { name: 'text-preparing', status: 'preparing', serial: 2 },
  {
    name: 'text-ready-for-delivery',
    status: 'ready-for-delivery',
    serial: 3,
  },
  { name: 'text-rider-assigned', status: 'rider-assigned', serial: 4 },
  {
    name: 'text-order-out-for-delivery',
    status: 'out-for-delivery',
    serial: 5,
  },
  { name: 'text-delivered', status: 'delivered', serial: 6 },
];

const CANCELLED_PROGRESS_STEP: FulfillmentProgressStep = {
  name: 'order-cancelled',
  status: 'cancelled',
  serial: 0,
};

const DELIVERY_FAILED_PROGRESS_STEP: FulfillmentProgressStep = {
  name: 'text-delivery-issue',
  status: 'delivery_failed',
  serial: 0,
};

const REFUNDED_PROGRESS_STEP: FulfillmentProgressStep = {
  name: 'order-refunded',
  status: 'refunded',
  serial: 0,
};

const FAILED_ORDER_PROGRESS_STEP: FulfillmentProgressStep = {
  name: 'order-failed',
  status: 'failed',
  serial: 0,
};

/** How far a delivery order progressed, ignoring completed/cancelled terminals. */
function getDeliveryReachedIndex(order: Order): number {
  const status = order.order_status;
  const delivery = getPrimaryDelivery(order);
  const shipmentStatus = delivery?.shipment_status;

  if (
    status === OrderStatus.OUT_FOR_DELIVERY ||
    shipmentStatus === 'in_progress'
  ) {
    return 4;
  }

  if (
    shipmentStatus === 'accepted' ||
    (order.product_fulfillment?.lines ?? []).some(
      (line) => line.fulfillment_status === 'rider_assigned',
    )
  ) {
    return 3;
  }

  if (
    status === OrderStatus.READY_FOR_DELIVERY ||
    shipmentStatus === 'pending_dispatch' ||
    shipmentStatus === 'pending' ||
    (order.product_fulfillment?.lines ?? []).some((line) =>
      ['ready_for_delivery', 'rider_requested'].includes(
        line.fulfillment_status ?? '',
      ),
    )
  ) {
    return 2;
  }

  const productLines = getActiveProductFulfillmentLines(order);
  if (
    productLines.some(
      (line) =>
        line.fulfillment_status === 'preparing' || !line.fulfillment_status,
    )
  ) {
    return 1;
  }

  return 0;
}

function getDeliveryTerminalProgressStep(
  order: Order,
): FulfillmentProgressStep | null {
  if (order.order_status === OrderStatus.REFUNDED) {
    return REFUNDED_PROGRESS_STEP;
  }
  if (order.order_status === OrderStatus.FAILED) {
    return FAILED_ORDER_PROGRESS_STEP;
  }
  if (isDeliveryCancelled(order)) {
    return CANCELLED_PROGRESS_STEP;
  }
  // aborted + fallback_pickup + delivery_failed lines → Delivery issue
  if (isDeliveryFailed(order)) {
    return DELIVERY_FAILED_PROGRESS_STEP;
  }
  return null;
}

export function getDeliveryProgressSteps(
  order: Order,
): FulfillmentProgressStep[] {
  const terminal = getDeliveryTerminalProgressStep(order);
  if (!terminal) {
    return DELIVERY_PROGRESS_STEPS;
  }

  const reached = getDeliveryReachedIndex(order);
  const prefix = DELIVERY_PROGRESS_STEPS.slice(
    0,
    Math.max(reached + 1, 1),
  ).filter((step) => step.status !== 'delivered');

  return [
    ...prefix,
    {
      ...terminal,
      serial: prefix.length + 1,
    },
  ];
}

export function getDeliveryProgressIndex(order: Order): number {
  const shipmentStatus = getPrimaryDelivery(order)?.shipment_status;

  if (
    order.order_status === OrderStatus.COMPLETED ||
    shipmentStatus === 'completed'
  ) {
    return DELIVERY_PROGRESS_STEPS.length - 1;
  }

  if (getDeliveryTerminalProgressStep(order)) {
    return getDeliveryProgressSteps(order).length - 1;
  }

  return getDeliveryReachedIndex(order);
}

export function getFulfillmentModeBadge(order: Order): {
  label: string;
  color: string;
} | null {
  if (!hasFulfillmentFlow(order)) {
    return null;
  }

  if (isDeliveryOrder(order)) {
    return {
      label: 'text-delivery-order',
      color: 'bg-blue-100 text-blue-800',
    };
  }

  if (isAppointmentOnlyOrder(order)) {
    return {
      label: 'text-service-order',
      color: 'bg-status-processing bg-opacity-10 text-status-processing',
    };
  }

  return {
    label: 'text-pickup-order',
    color: 'bg-accent bg-opacity-10 !text-accent',
  };
}

export const SERVICE_PROGRESS_STEPS: FulfillmentProgressStep[] = [
  { name: 'text-self-pickup-confirmed', status: 'confirmed', serial: 1 },
  { name: 'text-preparing', status: 'preparing', serial: 2 },
  { name: 'text-service-completed', status: 'service-completed', serial: 3 },
  { name: 'text-order-closed', status: 'closed', serial: 4 },
];

export const SELF_PICKUP_PROGRESS_STEPS: FulfillmentProgressStep[] = [
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

function getSelfPickupReachedIndex(order: Order): number {
  const productLines = getActiveProductFulfillmentLines(order);
  const hasProducts = productLines.length > 0;
  const allProductsTerminal =
    !hasProducts || productLines.every((line) => isProductLineTerminal(line));

  const ignoreService = shouldIgnoreServiceFulfillment(order);
  const service = order.service_fulfillment;
  const hasService = !ignoreService && Boolean(service?.booking_id);
  const serviceTerminal =
    !hasService || isServiceBookingTerminal(service?.status);

  if (allProductsTerminal && serviceTerminal) {
    return 3;
  }

  if (
    order.order_status === OrderStatus.READY_FOR_PICKUP ||
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

  return 0;
}

function getServiceReachedIndex(order: Order): number {
  const service = order.service_fulfillment;
  const hasService = Boolean(service?.booking_id);

  if (
    order.order_status === OrderStatus.COMPLETED ||
    (hasService && isServiceBookingTerminal(service?.status))
  ) {
    return 2;
  }

  if (
    order.order_status === OrderStatus.PROCESSING ||
    (hasService && service?.status === 'pending')
  ) {
    return 1;
  }

  return 0;
}

function getServiceTerminalProgressStep(
  order: Order,
): FulfillmentProgressStep | null {
  if (order.order_status === OrderStatus.CANCELLED) {
    return CANCELLED_PROGRESS_STEP;
  }
  if (order.order_status === OrderStatus.REFUNDED) {
    return REFUNDED_PROGRESS_STEP;
  }
  if (order.order_status === OrderStatus.FAILED) {
    return FAILED_ORDER_PROGRESS_STEP;
  }
  if (order.service_fulfillment?.status === 'unable_to_fulfill') {
    return {
      name: 'text-unable-to-fulfill',
      status: 'unable_to_fulfill',
      serial: 0,
    };
  }
  return null;
}

export function getServiceProgressSteps(
  order: Order,
): FulfillmentProgressStep[] {
  const terminal = getServiceTerminalProgressStep(order);
  if (!terminal) {
    return SERVICE_PROGRESS_STEPS;
  }

  const reached = getServiceReachedIndex(order);
  const prefix = SERVICE_PROGRESS_STEPS.slice(0, Math.max(reached + 1, 1)).filter(
    (step) => step.status !== 'service-completed' && step.status !== 'closed',
  );

  return [
    ...prefix,
    {
      ...terminal,
      serial: prefix.length + 1,
    },
  ];
}

export function getServiceProgressIndex(order: Order): number {
  if (order.order_status === OrderStatus.COMPLETED) {
    return SERVICE_PROGRESS_STEPS.length - 1;
  }

  if (getServiceTerminalProgressStep(order)) {
    return getServiceProgressSteps(order).length - 1;
  }

  return getServiceReachedIndex(order);
}

export function getSelfPickupProgressSteps(
  order: Order,
): FulfillmentProgressStep[] {
  let terminal: FulfillmentProgressStep | null = null;
  if (order.order_status === OrderStatus.CANCELLED) {
    terminal = CANCELLED_PROGRESS_STEP;
  } else if (order.order_status === OrderStatus.REFUNDED) {
    terminal = REFUNDED_PROGRESS_STEP;
  } else if (order.order_status === OrderStatus.FAILED) {
    terminal = FAILED_ORDER_PROGRESS_STEP;
  }

  if (!terminal) {
    return SELF_PICKUP_PROGRESS_STEPS;
  }

  const reached = getSelfPickupReachedIndex(order);
  const prefix = SELF_PICKUP_PROGRESS_STEPS.slice(
    0,
    Math.max(reached + 1, 1),
  ).filter(
    (step) => step.status !== 'picked_up' && step.status !== 'closed',
  );

  return [
    ...prefix,
    {
      ...terminal,
      serial: prefix.length + 1,
    },
  ];
}

export function getSelfPickupProgressIndex(order: Order): number {
  if (order.order_status === OrderStatus.COMPLETED) {
    return SELF_PICKUP_PROGRESS_STEPS.length - 1;
  }

  if (
    order.order_status === OrderStatus.CANCELLED ||
    order.order_status === OrderStatus.REFUNDED ||
    order.order_status === OrderStatus.FAILED
  ) {
    return getSelfPickupProgressSteps(order).length - 1;
  }

  return getSelfPickupReachedIndex(order);
}

export function getCloseOrderDisabledReason(order: Order): string | null {
  if (canCloseOrder(order)) {
    return null;
  }

  if (isDeliveryOrder(order)) {
    return 'text-close-order-wrong-status';
  }

  if (!getCloseableOrderStatuses(order).includes(order.order_status)) {
    return 'text-close-order-wrong-status';
  }

  const productLines = getActiveProductFulfillmentLines(order);
  const hasProducts = productLines.length > 0;
  const allProductsTerminal =
    !hasProducts || productLines.every((line) => isProductLineTerminal(line));

  if (hasProducts && !allProductsTerminal) {
    return 'text-close-order-products-pending';
  }

  if (!shouldIgnoreServiceFulfillment(order)) {
    const service = order.service_fulfillment;
    if (service?.booking_id && !isServiceBookingTerminal(service.status)) {
      return 'text-close-order-service-pending';
    }
  }

  return 'text-close-order-not-ready';
}

export function getFulfillmentAdminStatusOptions() {
  return [
    'order-pending',
    'order-processing',
    'order-ready-for-pickup',
    'order-ready-for-delivery',
    'order-out-for-delivery',
    'order-completed',
    'order-cancelled',
  ];
}

export function getListFulfillmentBadge(order: Order): {
  label: string;
  color: string;
  translate?: boolean;
} | null {
  // Prefer BE display label. Optional unpaid safety net during rollout.
  if (order.customer_status_label) {
    return {
      label: order.customer_status_label,
      color: getListFulfillmentBadgeColor(order),
    };
  }

  if (isAwaitingPayment(order)) {
    return {
      label: 'payment-pending',
      color: 'bg-status-pending bg-opacity-10 text-status-pending',
      translate: true,
    };
  }

  if (!hasFulfillmentFlow(order)) {
    return null;
  }

  if (isDeliveryCancelled(order)) {
    return {
      label: 'order-cancelled',
      color: 'bg-status-canceled bg-opacity-10 text-status-canceled',
      translate: true,
    };
  }

  if (isDeliveryFailed(order)) {
    return {
      label: 'text-delivery-issue',
      color: 'bg-status-canceled bg-opacity-10 text-status-canceled',
      translate: true,
    };
  }

  if (order.order_status === OrderStatus.OUT_FOR_DELIVERY) {
    return {
      label: 'text-order-out-for-delivery',
      color: 'bg-status-out-for-delivery bg-opacity-10 text-status-out-for-delivery',
      translate: true,
    };
  }

  if (order.order_status === OrderStatus.READY_FOR_DELIVERY) {
    return {
      label: 'text-ready-for-delivery',
      color: 'bg-accent bg-opacity-10 !text-accent',
      translate: true,
    };
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
  if (isDeliveryCancelled(order) || isDeliveryFailed(order)) {
    return 'bg-status-canceled bg-opacity-10 text-status-canceled';
  }
  if (isAwaitingPayment(order)) {
    return 'bg-status-pending bg-opacity-10 text-status-pending';
  }
  if (
    order.order_status === OrderStatus.READY_FOR_PICKUP ||
    order.order_status === OrderStatus.READY_FOR_DELIVERY
  ) {
    return 'bg-accent bg-opacity-10 !text-accent';
  }
  if (order.order_status === OrderStatus.OUT_FOR_DELIVERY) {
    return 'bg-status-out-for-delivery bg-opacity-10 text-status-out-for-delivery';
  }
  if (order.order_status === OrderStatus.COMPLETED) {
    return 'bg-status-complete bg-opacity-10 text-status-complete';
  }
  return 'bg-status-processing bg-opacity-10 text-status-processing';
}
