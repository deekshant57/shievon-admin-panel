import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Banknote, Filter } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type WithdrawsSummaryStripProps = {
  totalWithdraws?: number;
  matchingResults?: number;
  className?: string;
};

const WithdrawsSummaryStrip = ({
  totalWithdraws,
  matchingResults,
  className,
}: WithdrawsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Banknote className="h-5 w-5" />}
        label={t('sidebar-nav-item-withdraws')}
        value={totalWithdraws ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default WithdrawsSummaryStrip;
