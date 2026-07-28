import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { CircleHelp, Filter } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type FaqsSummaryStripProps = {
  totalFaqs?: number;
  matchingResults?: number;
  className?: string;
};

const FaqsSummaryStrip = ({
  totalFaqs,
  matchingResults,
  className,
}: FaqsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<CircleHelp className="h-5 w-5" />}
        label={t('text-faqs')}
        value={totalFaqs ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default FaqsSummaryStrip;
