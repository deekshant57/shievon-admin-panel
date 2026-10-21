import Search from '@/components/common/search';
import DataPanel from '@/components/page/data-panel';
import Layout from '@/components/layouts/admin';
import StaffList from '@/components/shop/staff-list';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useMyStaffsQuery } from '@/data/user';
import { SortOrder } from '@/types';
import { adminOnly } from '@/utils/auth-utils';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState } from 'react';

type MyStaffsPageProps = {
  initialMyStaffsData?: any
}

export default function MyStaffsPage({ initialMyStaffsData }: MyStaffsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { t } = useTranslation();

  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);

  const { myStaffs, paginatorInfo, loading, error } = useMyStaffsQuery(
    {
      limit: 20,
      page,
      name: searchTerm,
      is_active: true,
      orderBy,
      sortedBy,
    },
    { initialData: initialMyStaffsData }
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
        title={t('form:input-label-my-staffs')}
        subtitle={t('common:my-staffs-page-subtitle')}
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
          staffs={myStaffs}
          onPagination={handlePagination}
          paginatorInfo={paginatorInfo}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}

MyStaffsPage.authenticate = {
  permissions: adminOnly,
};
MyStaffsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
