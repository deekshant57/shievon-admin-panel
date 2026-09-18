import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import {
  Banknote,
  CalendarDays,
  Package,
  Percent,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { cn } from '@/lib/utils';

type ShopKpiStripProps = {
  productsCount?: number;
  ordersCount?: number;
  commissionRate?: number;
  /** Fallback when settlement API is unavailable */
  grossSales?: string;
  currentBalance?: string;
  receivedTotal?: string;
  pending?: string;
  todaysCollection?: string;
  totalCollection?: string;
  settlementEtaMessage?: string;
  withdrawsHref?: string;
  showFinancials?: boolean;
  className?: string;
};

const ShopKpiStrip = ({
  productsCount,
  ordersCount,
  commissionRate,
  grossSales,
  currentBalance,
  receivedTotal,
  pending,
  todaysCollection,
  totalCollection,
  settlementEtaMessage,
  withdrawsHref,
  showFinancials = true,
  className,
}: ShopKpiStripProps) => {
  const { t } = useTranslation('common');
  const useSettlement = Boolean(
    receivedTotal != null || pending != null || todaysCollection != null,
  );
  const columns = showFinancials ? (useSettlement ? 6 : 5) : 2;

  const receivedMetric = (
    <StatMetric
      icon={<Banknote className="h-5 w-5" />}
      label={t('text-received-total') || 'Received / Total'}
      value={receivedTotal ?? grossSales ?? '—'}
      note={settlementEtaMessage}
      className={withdrawsHref ? 'cursor-pointer transition hover:bg-accent/5' : undefined}
    />
  );

  return (
    <div className={cn('space-y-2', className)}>
      <StatStrip columns={columns}>
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
            {useSettlement ? (
              <>
                {withdrawsHref ? (
                  <Link href={withdrawsHref} className="block h-full">
                    {receivedMetric}
                  </Link>
                ) : (
                  receivedMetric
                )}
                <StatMetric
                  icon={<Wallet className="h-5 w-5" />}
                  label={t('text-pending-payout') || 'Pending'}
                  value={pending ?? currentBalance ?? '—'}
                  note={settlementEtaMessage}
                />
                <StatMetric
                  icon={<CalendarDays className="h-5 w-5" />}
                  label={t('text-todays-collection') || "Today's collection"}
                  value={todaysCollection ?? '—'}
                />
              </>
            ) : (
              <>
                <StatMetric
                  icon={<Banknote className="h-5 w-5" />}
                  label={t('text-gross-sales')}
                  value={grossSales ?? '—'}
                />
                <StatMetric
                  icon={<Wallet className="h-5 w-5" />}
                  label={t('text-current-balance')}
                  value={currentBalance ?? '—'}
                />
              </>
            )}
          </>
        ) : null}
      </StatStrip>
      {showFinancials && useSettlement && totalCollection ? (
        <p className="px-1 text-xs text-muted-foreground">
          {t('text-total-collection') || 'Total collection'}: {totalCollection}
          {settlementEtaMessage ? ` · ${settlementEtaMessage}` : null}
        </p>
      ) : null}
    </div>
  );
};

export default ShopKpiStrip;
