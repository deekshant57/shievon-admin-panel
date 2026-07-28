import { useState } from 'react';
import Search from '@/components/common/search';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import LinkActionButton from '@/components/ui/link-action-button';
import DataPanel from '@/components/page/data-panel';
import FlashSalesSummaryStrip from '@/components/flash-sale/flash-sales-summary-strip';
import { LIMIT } from '@/utils/constants';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '@/components/layouts/admin';
import { adminOnly } from '@/utils/auth-utils';
import { useRouter } from 'next/router';
import { Config } from '@/config';
import FlashSaleRequestLists from '@/components/flash-sale/vendor-request/flash-sale-vendor-request-list';
import { useRequestedListsForFlashSale } from '@/data/flash-sale-vendor-request';
import { SortOrder } from '@/types';

export default function FlashSaleVendorRequestListsForAdmin() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);

  const { flashSaleRequests, paginatorInfo, loading, error } =
    useRequestedListsForFlashSale({
      limit: LIMIT,
      orderBy,
      sortedBy,
      title: searchTerm,
      page,
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
      <FlashSalesSummaryStrip
        totalCampaigns={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title="Lists of created flash sale requests."
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            {locale === Config.defaultLanguage ? (
              <LinkActionButton
                href={`/flash-sale/vendor-request/create`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                <span className="hidden xl:block">+ Create Request</span>
                <span className="xl:hidden">+ {t('form:button-label-add')}</span>
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <FlashSaleRequestLists
          flashSaleRequests={flashSaleRequests}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}
FlashSaleVendorRequestListsForAdmin.authenticate = {
  permissions: adminOnly,
};
FlashSaleVendorRequestListsForAdmin.Layout = Layout;
export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'form', 'table'])),
  },
});
