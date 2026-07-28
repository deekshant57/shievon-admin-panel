import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import Select from '@/components/ui/select/select';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { adminOnly } from '@/utils/auth-utils';
import { useState } from 'react';
import { SortOrder } from '@/types';
import { useRefundsQuery } from '@/data/refund';
import RefundList from '@/components/refund/refund-list';
import RefundsSummaryStrip from '@/components/refund/refunds-summary-strip';
import { useRouter } from 'next/router';
import { useRefundReasonsQuery } from '@/data/refund-reason';

export default function RefundsPage() {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [reason, setReason] = useState('');
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { data, loading, error } = useRefundsQuery({
    limit: 10,
    page,
    refund_reason: reason,
    sortedBy,
    orderBy,
  });

  const { refundReasons, loading: isLoading } = useRefundReasonsQuery({
    language: locale,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handlePagination(current: any) {
    setPage(current);
  }

  const total = Array.isArray(data) ? undefined : data?.total;

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <RefundsSummaryStrip totalRefunds={total} matchingResults={total} />

      <DataPanel
        className="mb-0"
        title={t('common:sidebar-nav-item-refunds')}
        toolbarLayout="stacked"
        toolbar={
          <div className="w-full md:max-w-sm md:ms-auto">
            <Select
              options={refundReasons}
              getOptionLabel={(option: any) => option.name}
              getOptionValue={(option: any) => option.slug}
              placeholder={t('common:filter-by-reason-placeholder')}
              isLoading={isLoading}
              isSearchable={false}
              onChange={(reason: any) => {
                setReason(reason?.slug!);
                setPage(1);
              }}
              isClearable={true}
            />
          </div>
        }
      >
        <RefundList
          refunds={data}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}
RefundsPage.authenticate = {
  permissions: adminOnly,
};
RefundsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
