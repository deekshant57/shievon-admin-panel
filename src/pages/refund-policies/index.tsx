import Search from '@/components/common/search';
import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import RefundPolicyList from '@/components/refund-policy/refund-policy-list';
import RefundPoliciesSummaryStrip from '@/components/refund-policy/refund-policies-summary-strip';
import RefundPolicyStatusFilter from '@/components/refund-policy/refund-policy-status-filter';
import RefundPolicyTypeFilter from '@/components/refund-policy/refund-policy-type-filter';
import ErrorMessage from '@/components/ui/error-message';
import LinkActionButton from '@/components/ui/link-action-button';
import Loader from '@/components/ui/loader/loader';
import { Config } from '@/config';
import { Routes } from '@/config/routes';
import { useRefundPoliciesQuery } from '@/data/refund-policy';
import { SortOrder } from '@/types';
import { adminOnly } from '@/utils/auth-utils';
import { LIMIT } from '@/utils/constants';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function RefundPolicies() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);

  const { refundPolicies, loading, paginatorInfo, error } =
    useRefundPoliciesQuery({
      limit: LIMIT,
      title: searchTerm.replace(/-/g, ' '),
      target,
      status,
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
      <RefundPoliciesSummaryStrip
        totalPolicies={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('common:text-refund-policies')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-heading')}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 lg:flex-1"
            />
            <RefundPolicyTypeFilter
              className="w-full shrink-0 lg:w-44"
              onTargetFilter={(target: any) => {
                setTarget(target?.value!);
                setPage(1);
              }}
            />
            <RefundPolicyStatusFilter
              className="w-full shrink-0 lg:w-44"
              onStatusFilter={(target: any) => {
                setStatus(target?.value!);
                setPage(1);
              }}
            />
            {locale === Config.defaultLanguage ? (
              <LinkActionButton
                href={`${Routes.refundPolicies.create}`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center lg:w-auto"
              >
                + {t('form:button-label-add-refund-policy')}
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <RefundPolicyList
          refundPolicies={refundPolicies}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}
RefundPolicies.authenticate = {
  permissions: adminOnly,
};
RefundPolicies.Layout = Layout;

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['form', 'common', 'table'])),
  },
});
