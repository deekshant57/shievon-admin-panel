import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, Percent } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type TaxesSummaryStripProps = {
  totalTaxes?: number;
  matchingResults?: number;
  className?: string;
};

const TaxesSummaryStrip = ({
  totalTaxes,
  matchingResults,
  className,
}: TaxesSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Percent className="h-5 w-5" />}
        label={t('sidebar-nav-item-taxes')}
        value={totalTaxes ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default TaxesSummaryStrip;
