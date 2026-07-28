import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, Megaphone } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type StoreNoticesSummaryStripProps = {
  totalNotices?: number;
  matchingResults?: number;
  className?: string;
};

const StoreNoticesSummaryStrip = ({
  totalNotices,
  matchingResults,
  className,
}: StoreNoticesSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Megaphone className="h-5 w-5" />}
        label={t('sidebar-nav-item-store-notice')}
        value={totalNotices ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default StoreNoticesSummaryStrip;
