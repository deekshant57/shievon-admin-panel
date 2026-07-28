import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { ArrowLeftRight, Filter } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type ShopTransferSummaryStripProps = {
  totalRequests?: number;
  matchingResults?: number;
  className?: string;
};

const ShopTransferSummaryStrip = ({
  totalRequests,
  matchingResults,
  className,
}: ShopTransferSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<ArrowLeftRight className="h-5 w-5" />}
        label={t('text-transfer-shop-ownership')}
        value={totalRequests ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default ShopTransferSummaryStrip;
