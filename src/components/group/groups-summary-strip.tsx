import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type GroupsSummaryStripProps = {
  totalGroups?: number;
  matchingResults?: number;
  className?: string;
};

const GroupsSummaryStrip = ({
  totalGroups,
  matchingResults,
  className,
}: GroupsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<LayoutGrid className="h-5 w-5" />}
        label={t('sidebar-nav-item-groups')}
        value={totalGroups ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default GroupsSummaryStrip;
