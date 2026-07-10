import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { CheckCircle, Clock, Store } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type ShopsSummaryStripProps = {
  totalShops?: number;
  activeShops?: number;
  inactiveShops?: number;
  className?: string;
};

const ShopsSummaryStrip = ({
  totalShops,
  activeShops,
  inactiveShops,
  className,
}: ShopsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={3} className={className}>
      <StatMetric
        icon={<Store className="h-5 w-5" />}
        label={t('text-all-shops')}
        value={totalShops ?? '—'}
      />
      <StatMetric
        icon={<CheckCircle className="h-5 w-5" />}
        label={t('text-active')}
        value={activeShops ?? '—'}
      />
      <StatMetric
        icon={<Clock className="h-5 w-5" />}
        label={t('text-inactive-shops')}
        value={inactiveShops ?? '—'}
      />
    </StatStrip>
  );
};

export default ShopsSummaryStrip;
