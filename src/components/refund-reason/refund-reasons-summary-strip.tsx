import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, MessageSquareWarning } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type RefundReasonsSummaryStripProps = {
  totalReasons?: number;
  matchingResults?: number;
  className?: string;
};

const RefundReasonsSummaryStrip = ({
  totalReasons,
  matchingResults,
  className,
}: RefundReasonsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<MessageSquareWarning className="h-5 w-5" />}
        label={t('text-refund-reasons')}
        value={totalReasons ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default RefundReasonsSummaryStrip;
