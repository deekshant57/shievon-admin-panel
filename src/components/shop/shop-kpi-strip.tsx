import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import {
  Package,
  Percent,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'next-i18next';

type ShopKpiStripProps = {
  productsCount?: number;
  ordersCount?: number;
  commissionRate?: number;
  grossSales?: string;
  currentBalance?: string;
  showFinancials?: boolean;
  className?: string;
};

const ShopKpiStrip = ({
  productsCount,
  ordersCount,
  commissionRate,
  grossSales,
  currentBalance,
  showFinancials = true,
  className,
}: ShopKpiStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={showFinancials ? 5 : 2} className={className}>
      <StatMetric
        icon={<Package className="h-5 w-5" />}
        label={t('text-total-products')}
        value={productsCount?.toString() ?? '—'}
      />
      <StatMetric
        icon={<ShoppingBag className="h-5 w-5" />}
        label={t('text-total-orders')}
        value={ordersCount?.toString() ?? '—'}
      />
      {showFinancials ? (
        <>
          <StatMetric
            icon={<Percent className="h-5 w-5" />}
            label={t('text-commission-rate')}
            value={`${commissionRate ?? 0}%`}
          />
          <StatMetric
            icon={<TrendingUp className="h-5 w-5" />}
            label={t('text-gross-sales')}
            value={grossSales ?? '—'}
          />
          <StatMetric
            icon={<Wallet className="h-5 w-5" />}
            label={t('text-current-balance')}
            value={currentBalance ?? '—'}
          />
        </>
      ) : null}
    </StatStrip>
  );
};

export default ShopKpiStrip;
