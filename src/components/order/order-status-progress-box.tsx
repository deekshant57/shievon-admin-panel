import ProgressBox from '@/components/ui/progress-box/progress-box';
import { filterOrderStatus, ORDER_STATUS } from '@/utils/order-status';

import { OrderStatus, PaymentStatus } from '@/types';

interface Props {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

const OrderStatusProgressBox = ({ paymentStatus, orderStatus }: Props) => {
  const currentStatusIndex =
    ORDER_STATUS.findIndex((o) => o.status === orderStatus) ?? 0;
  const filterStatus = filterOrderStatus(
    ORDER_STATUS,
    paymentStatus!,
    currentStatusIndex,
  );
  const filledIndex = Math.max(
    0,
    filterStatus.findIndex((step) => step.status === orderStatus),
  );

  return (
    <ProgressBox
      data={filterStatus}
      status={orderStatus!}
      filledIndex={filledIndex >= 0 ? filledIndex : 0}
    />
  );
};

export default OrderStatusProgressBox;
