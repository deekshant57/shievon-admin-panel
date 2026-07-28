import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, RotateCcw } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type RefundsSummaryStripProps = {
  totalRefunds?: number;
  matchingResults?: number;
  className?: string;
};

const RefundsSummaryStrip = ({
  totalRefunds,
  matchingResults,
  className,
}: RefundsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<RotateCcw className="h-5 w-5" />}
        label={t('text-reported-refunds')}
        value={totalRefunds ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default RefundsSummaryStrip;
