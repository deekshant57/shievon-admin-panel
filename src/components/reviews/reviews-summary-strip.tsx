import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, Star } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type ReviewsSummaryStripProps = {
  totalReviews?: number;
  matchingResults?: number;
  className?: string;
};

const ReviewsSummaryStrip = ({
  totalReviews,
  matchingResults,
  className,
}: ReviewsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Star className="h-5 w-5" />}
        label={t('sidebar-nav-item-reviews')}
        value={totalReviews ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default ReviewsSummaryStrip;
