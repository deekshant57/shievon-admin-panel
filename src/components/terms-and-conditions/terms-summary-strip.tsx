import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, ScrollText } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type TermsSummaryStripProps = {
  totalTerms?: number;
  matchingResults?: number;
  className?: string;
};

const TermsSummaryStrip = ({
  totalTerms,
  matchingResults,
  className,
}: TermsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<ScrollText className="h-5 w-5" />}
        label={t('text-terms-and-conditions')}
        value={totalTerms ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default TermsSummaryStrip;
