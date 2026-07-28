import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, ListTree } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type AttributesSummaryStripProps = {
  totalAttributes?: number;
  matchingResults?: number;
  className?: string;
};

const AttributesSummaryStrip = ({
  totalAttributes,
  matchingResults,
  className,
}: AttributesSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<ListTree className="h-5 w-5" />}
        label={t('sidebar-nav-item-attributes')}
        value={totalAttributes ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default AttributesSummaryStrip;
