import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, Package, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type ProductsSummaryStripProps = {
  totalProducts?: number;
  matchingResults?: number;
  totalOrders?: number;
  className?: string;
};

const ProductsSummaryStrip = ({
  totalProducts,
  matchingResults,
  totalOrders,
  className,
}: ProductsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={3} className={className}>
      <StatMetric
        icon={<Package className="h-5 w-5" />}
        label={t('text-total-products')}
        value={totalProducts ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
      <StatMetric
        icon={<ShoppingBag className="h-5 w-5" />}
        label={t('text-total-orders')}
        value={totalOrders ?? '—'}
      />
    </StatStrip>
  );
};

export default ProductsSummaryStrip;
