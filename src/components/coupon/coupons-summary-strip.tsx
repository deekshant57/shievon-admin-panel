import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, Ticket } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type CouponsSummaryStripProps = {
  totalCoupons?: number;
  matchingResults?: number;
  className?: string;
};

const CouponsSummaryStrip = ({
  totalCoupons,
  matchingResults,
  className,
}: CouponsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Ticket className="h-5 w-5" />}
        label={t('text-all-coupons')}
        value={totalCoupons ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default CouponsSummaryStrip;
