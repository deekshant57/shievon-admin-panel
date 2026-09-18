import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Banknote, CalendarDays, Filter, Wallet } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type WithdrawsSummaryStripProps = {
  /** Legacy count-only mode */
  totalWithdraws?: number;
  matchingResults?: number;
  receivedTotal?: string;
  pending?: string;
  todaysCollection?: string;
  totalCollection?: string;
  settlementEtaMessage?: string;
  className?: string;
};

const WithdrawsSummaryStrip = ({
  totalWithdraws,
  matchingResults,
  receivedTotal,
  pending,
  todaysCollection,
  totalCollection,
  settlementEtaMessage,
  className,
}: WithdrawsSummaryStripProps) => {
  const { t } = useTranslation('common');
  const useSettlement =
    receivedTotal != null || pending != null || todaysCollection != null;

  if (!useSettlement) {
    return (
      <StatStrip columns={2} className={className}>
        <StatMetric
          icon={<Banknote className="h-5 w-5" />}
          label={t('sidebar-nav-item-withdraws')}
          value={totalWithdraws ?? '—'}
        />
        <StatMetric
          icon={<Filter className="h-5 w-5" />}
          label={t('text-matching-results')}
          value={matchingResults ?? '—'}
        />
      </StatStrip>
    );
  }

  return (
    <div className={className}>
      <StatStrip columns={4}>
        <StatMetric
          icon={<Banknote className="h-5 w-5" />}
          label={t('text-received-total') || 'Received / Total'}
          value={receivedTotal ?? '—'}
        />
        <StatMetric
          icon={<Wallet className="h-5 w-5" />}
          label={t('text-pending-payout') || 'Pending'}
          value={pending ?? '—'}
        />
        <StatMetric
          icon={<CalendarDays className="h-5 w-5" />}
          label={t('text-todays-collection') || "Today's collection"}
          value={todaysCollection ?? '—'}
        />
        <StatMetric
          icon={<Filter className="h-5 w-5" />}
          label={t('text-total-collection') || 'Total collection'}
          value={totalCollection ?? '—'}
        />
      </StatStrip>
      {settlementEtaMessage ? (
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          {settlementEtaMessage}
        </p>
      ) : null}
    </div>
  );
};

export default WithdrawsSummaryStrip;
