import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, Tags } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type TagsSummaryStripProps = {
  totalTags?: number;
  matchingResults?: number;
  className?: string;
};

const TagsSummaryStrip = ({
  totalTags,
  matchingResults,
  className,
}: TagsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Tags className="h-5 w-5" />}
        label={t('sidebar-nav-item-tags')}
        value={totalTags ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default TagsSummaryStrip;
