import ProgressBox from '@/components/ui/progress-box/progress-box';
import { Order } from '@/types';
import {
  getDeliveryProgressIndex,
  getDeliveryProgressSteps,
} from '@/utils/order-fulfillment';

type OrderDeliveryProgressProps = {
  order: Order;
};

export default function OrderDeliveryProgress({
  order,
}: OrderDeliveryProgressProps) {
  const steps = getDeliveryProgressSteps(order);
  const filledIndex = getDeliveryProgressIndex(order);
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
