import ProgressBox from '@/components/ui/progress-box/progress-box';
import { Order } from '@/types';
import {
  getSelfPickupProgressIndex,
  getSelfPickupProgressSteps,
} from '@/utils/order-fulfillment';

type OrderSelfPickupProgressProps = {
  order: Order;
};

export default function OrderSelfPickupProgress({
  order,
}: OrderSelfPickupProgressProps) {
  const steps = getSelfPickupProgressSteps(order);
  const filledIndex = getSelfPickupProgressIndex(order);
  const currentStep = steps[filledIndex];

  return (
    <div className="w-full min-w-0">
      <ProgressBox
        data={steps}
        status={currentStep?.status ?? 'confirmed'}
        filledIndex={filledIndex}
      />
    </div>
  );
}
