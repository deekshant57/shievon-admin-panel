import Search from '@/components/common/search';
import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import OwnershipTransferLists from '@/components/ownership-transfer/ownership-transfer-list';
import ShopTransferSummaryStrip from '@/components/ownership-transfer/shop-transfer-summary-strip';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useOwnerShipTransfersQuery } from '@/data/ownership-transfer';
import { SortOrder } from '@/types';
import { adminOnly, getAuthCredentials } from '@/utils/auth-utils';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useMeQuery } from '@/data/user';

export default function ShopTransferRequestPage() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: user, isLoading: loading, error } = useMeQuery();
  const { role } = getAuthCredentials();

  const {
    ownershipTransfer,
    loading: loadingRequest,
    paginatorInfo,
    error: errorRequest,
  } = useOwnerShipTransfersQuery({
    language: locale,
    limit: 10,
    page,
    orderBy,
    sortedBy,
    transaction_identifier: searchTerm,
  });

  // TODO : error need to be handled properly.
  if (loading || loadingRequest)
    return <Loader text={t('common:text-loading')} />;
  if (error || errorRequest) return <ErrorMessage message={error?.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: number) {
    setPage(current);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <ShopTransferSummaryStrip
        totalRequests={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title="Shop Ownership Transfer Request List"
        toolbarLayout="stacked"
        toolbar={
          <Search
            onSearch={handleSearch}
            placeholderText="Search by request tracker"
            debounceMs={400}
            variant="hybrid"
            size="sm"
            className="w-full"
          />
        }
      >
        <OwnershipTransferLists
          userRole={role}
          user={user}
          ownershipTransfer={ownershipTransfer}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}

ShopTransferRequestPage.authenticate = {
  permissions: adminOnly,
};

ShopTransferRequestPage.Layout = Layout;
export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['form', 'common', 'table'])),
  },
});
