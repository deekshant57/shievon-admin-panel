import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, FileText } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type RefundPoliciesSummaryStripProps = {
  totalPolicies?: number;
  matchingResults?: number;
  className?: string;
};

const RefundPoliciesSummaryStrip = ({
  totalPolicies,
  matchingResults,
  className,
}: RefundPoliciesSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<FileText className="h-5 w-5" />}
        label={t('text-refund-policies')}
        value={totalPolicies ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default RefundPoliciesSummaryStrip;
