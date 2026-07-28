import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Bell, Filter } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type NotifyLogsSummaryStripProps = {
  totalLogs?: number;
  matchingResults?: number;
  className?: string;
};

const NotifyLogsSummaryStrip = ({
  totalLogs,
  matchingResults,
  className,
}: NotifyLogsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Bell className="h-5 w-5" />}
        label={t('text-notifications')}
        value={totalLogs ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default NotifyLogsSummaryStrip;
