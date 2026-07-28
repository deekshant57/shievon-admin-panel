import Search from '@/components/common/search';
import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import RefundReasonList from '@/components/refund-reason/refund-reason-list';
import RefundReasonsSummaryStrip from '@/components/refund-reason/refund-reasons-summary-strip';
import ErrorMessage from '@/components/ui/error-message';
import LinkActionButton from '@/components/ui/link-action-button';
import Loader from '@/components/ui/loader/loader';
import { Config } from '@/config';
import { Routes } from '@/config/routes';
import { useRefundReasonsQuery } from '@/data/refund-reason';
import { SortOrder } from '@/types';
import { adminOnly } from '@/utils/auth-utils';
import { LIMIT } from '@/utils/constants';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function RefundReasons() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);

  const { refundReasons, loading, paginatorInfo, error } =
    useRefundReasonsQuery({
      limit: LIMIT,
      name: searchTerm.replace(/-/g, ' '),
      page,
      orderBy,
      sortedBy,
      language: locale,
    });
  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
  }

  function handlePagination(current: number) {
    setPage(current);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <RefundReasonsSummaryStrip
        totalReasons={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('common:text-refund-reasons')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-name')}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            {locale === Config.defaultLanguage ? (
              <LinkActionButton
                href={`${Routes.refundReasons.create}`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                + {t('form:button-label-add-refund-reason')}
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <RefundReasonList
          refundReasons={refundReasons}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}
RefundReasons.authenticate = {
  permissions: adminOnly,
};
RefundReasons.Layout = Layout;

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['form', 'common', 'table'])),
  },
});
