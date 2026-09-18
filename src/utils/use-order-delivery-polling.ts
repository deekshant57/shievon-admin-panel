import { useEffect } from 'react';
import { Order } from '@/types';
import {
  getPrimaryDelivery,
  shouldPollDeliveryTracking,
} from '@/utils/order-fulfillment';

const DELIVERY_POLL_INTERVAL_MS = 8000;

export function useOrderDeliveryPolling(
  order: Order | undefined,
  refetch: () => void,
  enabled = false,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const delivery = getPrimaryDelivery(order);
    if (!shouldPollDeliveryTracking(delivery)) {
      return;
    }

    const interval = setInterval(() => {
      refetch();
    }, DELIVERY_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [order, refetch, enabled]);
}
