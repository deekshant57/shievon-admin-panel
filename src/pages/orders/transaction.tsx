import Layout from '@/components/layouts/admin';
import Search from '@/components/common/search';
import DataPanel from '@/components/page/data-panel';
import ActionButton from '@/components/ui/action-button';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useOrdersQuery } from '@/data/order';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { SortOrder } from '@/types';
import { adminOnly } from '@/utils/auth-utils';
import { useExportOrderQuery } from '@/data/export';
import { useRouter } from 'next/router';
import { useShopQuery } from '@/data/shop';
import { DownloadIcon } from '@/components/icons/download-icon';
import OrderTransactionList from '@/components/order/order-transaction-lists';

export default function TransactionsPage() {
  const router = useRouter();
  const { locale } = useRouter();
  const {
    query: { shop },
  } = router;
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  const { data: shopData } = useShopQuery(
    {
      slug: shop as string,
    },
    {
      enabled: !!shop,
    },
  );
  const shopId = shopData?.id!;
  const { orders, loading, paginatorInfo, error } = useOrdersQuery({
    language: locale,
    limit: 20,
    page,
    tracking_number: searchTerm,
    orderBy,
    sortedBy,
  });
  const { refetch } = useExportOrderQuery(
    {
      ...(shopId && { shop_id: shopId }),
    },
    { enabled: false },
  );

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  async function handleExportOrder() {
    const { data } = await refetch();

    if (data) {
      const a = document.createElement('a');
      a.href = data;
      a.setAttribute('download', 'export-order');
      a.click();
    }
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <DataPanel
        className="mb-0"
        title={t('form:form-title-transactions')}
        subtitle={t('common:transactions-page-subtitle')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t(
                'form:input-placeholder-search-tracking-number',
              )}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            <ActionButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleExportOrder}
              className="w-full shrink-0 justify-center sm:w-auto"
            >
              <DownloadIcon className="me-2 h-4 w-4 shrink-0" />
              {t('common:text-export-orders')}
            </ActionButton>
          </div>
        }
      >
        <OrderTransactionList
          orders={orders}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}

TransactionsPage.authenticate = {
  permissions: adminOnly,
};
TransactionsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
