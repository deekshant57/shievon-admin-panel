import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, Users } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type StaffsSummaryStripProps = {
  totalStaffs?: number;
  matchingResults?: number;
  className?: string;
};

const StaffsSummaryStrip = ({
  totalStaffs,
  matchingResults,
  className,
}: StaffsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Users className="h-5 w-5" />}
        label={t('sidebar-nav-item-staffs')}
        value={totalStaffs ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default StaffsSummaryStrip;
