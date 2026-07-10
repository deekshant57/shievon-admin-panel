import DashboardSection from '@/components/dashboard/layout/dashboard-section';
import TimeRangeToggle, {
  type TimeRangeOption,
} from '@/components/dashboard/layout/time-range-toggle';
import { TodayTotalOrderByStatus } from '@/types';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';

const OrderStatusWidget = dynamic(
  () => import('@/components/dashboard/widgets/box/widget-order-by-status'),
);

type OrderStatusSectionProps = {
  analyticsData?: {
    todayTotalOrderByStatus?: TodayTotalOrderByStatus;
    weeklyTotalOrderByStatus?: TodayTotalOrderByStatus;
    monthlyTotalOrderByStatus?: TodayTotalOrderByStatus;
    yearlyTotalOrderByStatus?: TodayTotalOrderByStatus;
  };
  allowedStatus: string[];
};

const OrderStatusSection = ({
  analyticsData,
  allowedStatus,
}: OrderStatusSectionProps) => {
  const { t } = useTranslation();
  const [activeTimeFrame, setActiveTimeFrame] = useState(1);
  const [orderDataRange, setOrderDataRange] = useState(
    analyticsData?.todayTotalOrderByStatus,
  );

  const timeRangeOptions = useMemo<TimeRangeOption[]>(
    () => [
      { label: t('text-today'), value: 1 },
      { label: t('text-weekly'), value: 7 },
      { label: t('text-monthly'), value: 30 },
      { label: t('text-yearly'), value: 365 },
    ],
    [t],
  );

  useEffect(() => {
    switch (activeTimeFrame) {
      case 1:
        setOrderDataRange(analyticsData?.todayTotalOrderByStatus);
        break;
      case 7:
        setOrderDataRange(analyticsData?.weeklyTotalOrderByStatus);
        break;
      case 30:
        setOrderDataRange(analyticsData?.monthlyTotalOrderByStatus);
        break;
      case 365:
        setOrderDataRange(analyticsData?.yearlyTotalOrderByStatus);
        break;
      default:
        setOrderDataRange(orderDataRange);
        break;
    }
  });

  return (
    <DashboardSection
      title={t('text-order-status')}
      toolbar={
        <TimeRangeToggle
          value={activeTimeFrame}
          onChange={setActiveTimeFrame}
          options={timeRangeOptions}
        />
      }
      contentClassName="!pt-5"
    >
      <OrderStatusWidget
        order={orderDataRange}
        allowedStatus={allowedStatus}
      />
    </DashboardSection>
  );
};

export default OrderStatusSection;
