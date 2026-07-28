import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Building2, Filter } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type ManufacturersSummaryStripProps = {
  totalManufacturers?: number;
  matchingResults?: number;
  className?: string;
};

const ManufacturersSummaryStrip = ({
  totalManufacturers,
  matchingResults,
  className,
}: ManufacturersSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Building2 className="h-5 w-5" />}
        label={t('sidebar-nav-item-manufacturers')}
        value={totalManufacturers ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default ManufacturersSummaryStrip;
