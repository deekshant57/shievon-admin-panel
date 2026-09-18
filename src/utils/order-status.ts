import { PaymentStatus } from '@/types';

export const ORDER_STATUS = [
  { name: 'text-order-pending', status: 'order-pending', serial: 1 },
  { name: 'text-order-processing', status: 'order-processing', serial: 2 },
  {
    name: 'text-order-at-local-facility',
    status: 'order-at-local-facility',
    serial: 3,
  },
  {
    name: 'text-order-out-for-delivery',
    status: 'order-out-for-delivery',
    serial: 4,
  },
  { name: 'text-order-completed', status: 'order-completed', serial: 5 },
  { name: 'text-order-cancelled', status: 'order-cancelled', serial: 5 },
  {
    name: 'text-order-ready-for-pickup',
    status: 'order-ready-for-pickup',
    serial: 5,
  },
  {
    name: 'text-order-ready-for-delivery',
    status: 'order-ready-for-delivery',
    serial: 5,
  },
  { name: 'text-order-refunded', status: 'order-refunded', serial: 5 },
  { name: 'text-order-failed', status: 'order-failed', serial: 5 },
];

/** Legacy strip without delivery logistics (used when fulfillment UI is not active). */
export const LEGACY_ORDER_PROGRESS = [
  ORDER_STATUS[0], // pending
  ORDER_STATUS[1], // processing
  ORDER_STATUS[4], // completed
];

const LEGACY_TERMINAL_STATUSES = new Set([
  'order-cancelled',
  'order-refunded',
  'order-failed',
  'order-ready-for-pickup',
  'order-ready-for-delivery',
  'order-at-local-facility',
  'order-out-for-delivery',
]);

/**
 * Legacy progress for unpaid / non-fulfillment orders.
 * Never invents "Out for delivery" for pickup or service orders.
 */
export const filterOrderStatus = (
  orderStatus: typeof ORDER_STATUS,
  paymentStatus: PaymentStatus,
  currentStatusIndex: number,
) => {
  const current = orderStatus[currentStatusIndex];
  const isPaid = [PaymentStatus.SUCCESS, PaymentStatus.COD].includes(
    paymentStatus,
  );

  // Paid orders normally use the fulfillment UI. If we still land here,
  // keep a simple strip — never show delivery steps unless status is already there.
  if (
    current &&
    LEGACY_TERMINAL_STATUSES.has(current.status) &&
    current.status !== 'order-completed'
  ) {
    return [
      LEGACY_ORDER_PROGRESS[0],
      LEGACY_ORDER_PROGRESS[1],
      { ...current, serial: 3 },
    ];
  }

  if (!isPaid) {
    return LEGACY_ORDER_PROGRESS;
  }

  return LEGACY_ORDER_PROGRESS;
};
