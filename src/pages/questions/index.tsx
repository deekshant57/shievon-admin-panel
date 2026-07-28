import QuestionList from '@/components/question/question-list';
import QuestionsSummaryStrip from '@/components/question/questions-summary-strip';
import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { SortOrder } from '@/types';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useQuestionsQuery } from '@/data/question';
import { adminOnly } from '@/utils/auth-utils';

export default function Questions() {
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { questions, paginatorInfo, loading, error } = useQuestionsQuery({
    limit: 15,
    page,
    answer: 'null',
    orderBy,
    sortedBy,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handlePagination(current: any) {
    setPage(current);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <QuestionsSummaryStrip
        totalQuestions={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('common:sidebar-nav-item-questions')}
        toolbarLayout="stacked"
      >
        <QuestionList
          questions={questions}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}

Questions.authenticate = {
  permissions: adminOnly,
};
Questions.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common', 'table'])),
  },
});
