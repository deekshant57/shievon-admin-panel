import ProgressBox from '@/components/ui/progress-box/progress-box';
import { Order } from '@/types';
import {
  getServiceProgressIndex,
  getServiceProgressSteps,
} from '@/utils/order-fulfillment';

type OrderServiceProgressProps = {
  order: Order;
};

export default function OrderServiceProgress({
  order,
}: OrderServiceProgressProps) {
  const steps = getServiceProgressSteps(order);
  const filledIndex = getServiceProgressIndex(order);
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
