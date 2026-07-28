import ReviewList from '@/components/reviews/review-list';
import ReviewsSummaryStrip from '@/components/reviews/reviews-summary-strip';
import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { SortOrder } from '@/types';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useReviewsQuery } from '@/data/review';
import { adminOnly } from '@/utils/auth-utils';

export default function Reviews() {
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { reviews, paginatorInfo, loading, error } = useReviewsQuery({
    limit: 15,
    page,
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
      <ReviewsSummaryStrip
        totalReviews={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('form:input-label-reviews')}
        toolbarLayout="stacked"
      >
        <ReviewList
          reviews={reviews}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}
Reviews.authenticate = {
  permissions: adminOnly,
};
Reviews.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common', 'table'])),
  },
});
