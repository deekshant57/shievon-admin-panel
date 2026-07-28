import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, Zap } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type FlashSalesSummaryStripProps = {
  totalCampaigns?: number;
  matchingResults?: number;
  className?: string;
};

const FlashSalesSummaryStrip = ({
  totalCampaigns,
  matchingResults,
  className,
}: FlashSalesSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<Zap className="h-5 w-5" />}
        label={t('text-flash-sale')}
        value={totalCampaigns ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default FlashSalesSummaryStrip;
