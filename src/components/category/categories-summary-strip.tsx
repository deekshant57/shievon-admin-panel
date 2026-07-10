import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, FolderTree } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type CategoriesSummaryStripProps = {
  totalCategories?: number;
  matchingResults?: number;
  className?: string;
};

const CategoriesSummaryStrip = ({
  totalCategories,
  matchingResults,
  className,
}: CategoriesSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<FolderTree className="h-5 w-5" />}
        label={t('text-total-categories')}
        value={totalCategories ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default CategoriesSummaryStrip;
