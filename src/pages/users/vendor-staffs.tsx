import Search from '@/components/common/search';
import DataPanel from '@/components/page/data-panel';
import Layout from '@/components/layouts/admin';
import StaffList from '@/components/shop/staff-list';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useAllStaffsQuery } from '@/data/user';
import { SortOrder } from '@/types';
import { adminOnly } from '@/utils/auth-utils';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState } from 'react';

type VendorStaffsPageProps = {
  initialAllStaffsData?: any
}

export default function VendorStaffsPage({ initialAllStaffsData }: VendorStaffsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { t } = useTranslation();

  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);

  const { allStaffs, paginatorInfo, loading, error } = useAllStaffsQuery(
    {
      limit: 20,
      page,
      name: searchTerm,
      is_active: true,
      orderBy,
      sortedBy,
    },
    { initialData: initialAllStaffsData }
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
        title={t('form:input-label-all-staffs')}
        subtitle={t('common:vendor-staffs-page-subtitle')}
        toolbarLayout="stacked"
        toolbar={
          <Search
            onSearch={handleSearch}
            placeholderText={t('form:input-placeholder-search-name')}
            debounceMs={400}
            variant="hybrid"
            size="sm"
            className="w-full min-w-0 sm:max-w-md"
          />
        }
      >
        <StaffList
          staffs={allStaffs}
          onPagination={handlePagination}
          paginatorInfo={paginatorInfo}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}

VendorStaffsPage.authenticate = {
  permissions: adminOnly,
};
VendorStaffsPage.Layout = Layout;

export const getServerSideProps = async (context: any) => {
  const { fetchAllStaffsFromApi } = await import('@/data/server-api')
  const initialData = await fetchAllStaffsFromApi(context, {
    limit: 20,
    page: 1,
    orderBy: 'created_at',
    sortedBy: 'desc',
    is_active: true,
  })
  return {
    props: {
      ...(await serverSideTranslations(context.locale, ['table', 'common', 'form'])),
      initialAllStaffsData: initialData ?? null,
    },
  }
}
