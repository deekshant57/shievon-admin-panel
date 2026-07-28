import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, PenLine } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type AuthorsSummaryStripProps = {
  totalAuthors?: number;
  matchingResults?: number;
  className?: string;
};

const AuthorsSummaryStrip = ({
  totalAuthors,
  matchingResults,
  className,
}: AuthorsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<PenLine className="h-5 w-5" />}
        label={t('sidebar-nav-item-authors')}
        value={totalAuthors ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default AuthorsSummaryStrip;
