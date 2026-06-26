import StatMetric from '@/components/page/stat-metric';
import { useTranslation } from 'react-i18next';
import { TodayTotalOrderByStatus } from '@/types';
import { Fragment } from 'react';
import { OrderProcessedIcon } from '@/components/icons/summary/order-processed';
import { CustomersIcon } from '@/components/icons/summary/customers';
import { ChecklistIcon } from '@/components/icons/summary/checklist';
import { EaringIcon } from '@/components/icons/summary/earning';

interface IProps {
  order: TodayTotalOrderByStatus;
  allowedStatus: any;
}

const WidgetOrderByStatus: React.FC<IProps> = ({
  order,
  allowedStatus,
}) => {
  const { t } = useTranslation();

  const tempContent = [];
  const widgetContents = [
    {
      key: 'pending',
      title: t('text-pending-order'),
      icon: <ChecklistIcon className="h-6 w-6" />,
      data: order?.pending!,
    },
    {
      key: 'processing',
      title: t('text-processing-order'),
      icon: <CustomersIcon className="h-6 w-6" />,
      data: order?.processing!,
    },
    {
      key: 'complete',
      title: t('text-completed-order'),
      icon: <OrderProcessedIcon className="h-6 w-6" />,
      data: order?.complete!,
    },
    {
      key: 'cancel',
      title: t('text-cancelled-order'),
      icon: <EaringIcon className="h-6 w-6" />,
      data: order?.cancelled!,
    },
    {
      key: 'refund',
      title: t('text-refunded-order'),
      icon: <OrderProcessedIcon className="h-6 w-6" />,
      data: order?.refunded!,
    },
    {
      key: 'fail',
      title: t('text-failed-order'),
      icon: <OrderProcessedIcon className="h-6 w-6" />,
      data: order?.failed!,
    },
    {
      key: 'local-facility',
      title: t('text-order-local-facility'),
      icon: <OrderProcessedIcon className="h-6 w-6" />,
      data: order?.localFacility!,
    },
    {
      key: 'out-for-delivery',
      title: t('text-order-out-delivery'),
      icon: <OrderProcessedIcon className="h-6 w-6" />,
      data: order?.outForDelivery!,
    },
  ];

  for (let index = 0; index < allowedStatus.length; index++) {
    const element = allowedStatus[index];
    const items = widgetContents.find((item) => item.key === element);
    tempContent.push(items);
  }

  return (
    <Fragment>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tempContent && tempContent.length > 0
          ? tempContent.map((content) => {
              return (
                <StatMetric
                  key={content?.key}
                  label={content?.title ?? ''}
                  value={content?.data}
                  icon={content?.icon}
                  variant="card"
                  className="h-full"
                />
              );
            })
          : null}
      </div>
    </Fragment>
  );
};

export default WidgetOrderByStatus;
