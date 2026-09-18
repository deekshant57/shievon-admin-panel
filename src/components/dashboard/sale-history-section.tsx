import EmptyState from '@/components/page/empty-state';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import ColumnChart from '@/components/widgets/column-chart';
import { DashboardSection } from '@/components/dashboard/layout';
import { useTranslation } from 'next-i18next';
import { useMemo, type ReactNode } from 'react';

type SaleByMonth = {
  total: number;
};

type SaleHistorySectionProps = {
  salesByMonth?: SaleByMonth[] | null;
  isLoading?: boolean;
  error?: Error | null;
  contentClassName?: string;
};

const SaleHistorySection = ({
  salesByMonth,
  isLoading = false,
  error = null,
  contentClassName = '!p-0 !pt-0 md:!px-2 md:!pb-2',
}: SaleHistorySectionProps) => {
  const { t } = useTranslation();

  const monthCategories = useMemo(
    () => [
      t('common:january'),
      t('common:february'),
      t('common:march'),
      t('common:april'),
      t('common:may'),
      t('common:june'),
      t('common:july'),
      t('common:august'),
      t('common:september'),
      t('common:october'),
      t('common:november'),
      t('common:december'),
    ],
    [t],
  );

  const hasSaleHistory = Array.isArray(salesByMonth) && salesByMonth.length > 0;

  const series = useMemo(() => {
    if (!hasSaleHistory || !salesByMonth) return [];
    return salesByMonth.map((item) => Number(Number(item.total).toFixed(2)));
  }, [hasSaleHistory, salesByMonth]);

  let content: ReactNode;

  if (isLoading) {
    content = (
      <div className="flex min-h-[280px] items-center justify-center py-10">
        <Loader simple showText={false} />
      </div>
    );
  } else if (error) {
    content = (
      <div className="px-4 py-6">
        <ErrorMessage message={error.message} />
      </div>
    );
  } else if (!hasSaleHistory) {
    content = (
      <EmptyState
        className="min-h-[280px] justify-center"
        title={t('common:text-no-sale-history') || 'No sales data yet'}
        description={
          t('common:text-no-sale-history-description') ||
          'Sales will appear here once orders are completed.'
        }
      />
    );
  } else {
    content = (
      <ColumnChart
        hideHeader
        colors={['hsl(357,73%,48%)']}
        series={series}
        categories={monthCategories}
      />
    );
  }

  return (
    <DashboardSection title={t('common:sale-history')} contentClassName={contentClassName}>
      {content}
    </DashboardSection>
  );
};

export default SaleHistorySection;

export function mapSalesSparkline(
  salesByMonth: SaleByMonth[] | null | undefined,
  monthCategories: string[],
): { label: string; value: number }[] {
  if (!Array.isArray(salesByMonth) || salesByMonth.length === 0) {
    return [];
  }

  return salesByMonth.map((item, index) => ({
    label: monthCategories[index]?.slice(0, 3) ?? '',
    value: Number(item.total) || 0,
  }));
}
