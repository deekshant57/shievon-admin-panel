import ProgressBox from '@/components/ui/progress-box/progress-box';
import { Order } from '@/types';
import {
  getSelfPickupProgressIndex,
  SELF_PICKUP_PROGRESS_STEPS,
} from '@/utils/order-fulfillment';

type OrderSelfPickupProgressProps = {
  order: Order;
};

export default function OrderSelfPickupProgress({
  order,
}: OrderSelfPickupProgressProps) {
  const filledIndex = getSelfPickupProgressIndex(order);
  const currentStep = SELF_PICKUP_PROGRESS_STEPS[filledIndex];

  return (
    <ProgressBox
      data={SELF_PICKUP_PROGRESS_STEPS}
      status={currentStep?.status ?? 'confirmed'}
      filledIndex={filledIndex}
    />
  );
}
