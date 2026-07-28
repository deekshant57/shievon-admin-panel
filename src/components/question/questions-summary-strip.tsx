import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import { Filter, MessageCircleQuestion } from 'lucide-react';
import { useTranslation } from 'next-i18next';

type QuestionsSummaryStripProps = {
  totalQuestions?: number;
  matchingResults?: number;
  className?: string;
};

const QuestionsSummaryStrip = ({
  totalQuestions,
  matchingResults,
  className,
}: QuestionsSummaryStripProps) => {
  const { t } = useTranslation('common');

  return (
    <StatStrip columns={2} className={className}>
      <StatMetric
        icon={<MessageCircleQuestion className="h-5 w-5" />}
        label={t('sidebar-nav-item-questions')}
        value={totalQuestions ?? '—'}
      />
      <StatMetric
        icon={<Filter className="h-5 w-5" />}
        label={t('text-matching-results')}
        value={matchingResults ?? '—'}
      />
    </StatStrip>
  );
};

export default QuestionsSummaryStrip;
