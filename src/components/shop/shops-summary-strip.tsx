import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { CheckCircle, Clock, Store } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type ShopsSummaryStripProps = {
  totalShops?: number;
  inactiveShops?: number;
  className?: string;
};

const ShopsSummaryStrip = ({
  totalShops,
  inactiveShops,
  className,
}: ShopsSummaryStripProps) => {
  const { t } = useTranslation('common');
  const activeShops =
    totalShops != null && inactiveShops != null
      ? Math.max(totalShops - inactiveShops, 0)
      : undefined;

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
