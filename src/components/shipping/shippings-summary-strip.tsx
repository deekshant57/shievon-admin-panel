import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, Truck } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type ShippingsSummaryStripProps = {
  totalShippings?: number;
  matchingResults?: number;
  className?: string;
};

const ShippingsSummaryStrip = ({
  totalShippings,
  matchingResults,
  className,
}: ShippingsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Truck className="h-5 w-5" />}
        label={t('sidebar-nav-item-shippings')}
        value={totalShippings ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default ShippingsSummaryStrip;
