import Layout from '@/components/layouts/admin';
import Search from '@/components/common/search';
import CustomerList from '@/components/user/user-list';
import LinkActionButton from '@/components/ui/link-action-button';
import DataPanel from '@/components/page/data-panel';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useCustomersQuery } from '@/data/user';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Routes } from '@/config/routes';
import { SortOrder } from '@/types';
import { adminOnly } from '@/utils/auth-utils';

type CustomersPageProps = {
  initialCustomersData?: any
}

export default function CustomersPage({ initialCustomersData }: CustomersPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { t } = useTranslation();

  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);

  const { customers, paginatorInfo, loading, error } = useCustomersQuery(
    {
      limit: 20,
      page,
      search: searchTerm,
      orderBy,
      sortedBy,
    },
    { initialData: initialCustomersData }
  );

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <DataPanel
        className="mb-0"
        title={t('form:input-label-customers')}
        subtitle={t('common:customers-page-subtitle')}
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
            <LinkActionButton
              href={Routes.user.create}
              variant="primary"
              size="sm"
              className="w-full shrink-0 justify-center sm:w-auto"
            >
              + {t('form:button-label-add-customer')}
            </LinkActionButton>
          </div>
        }
      >
        <CustomerList
          customers={customers}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}

CustomersPage.authenticate = {
  permissions: adminOnly,
};
CustomersPage.Layout = Layout;

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
