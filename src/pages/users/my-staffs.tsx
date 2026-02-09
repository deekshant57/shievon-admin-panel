import Card from '@/components/common/card';
import Search from '@/components/common/search';
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
import PageHeading from '@/components/common/page-heading';

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
    <>
      <Card className="mb-8 flex flex-col items-center md:flex-row">
        <div className="mb-4 md:mb-0 md:w-1/4">
          <PageHeading title={t('form:input-label-my-staffs')} />
        </div>

        <div className="flex w-full items-center ms-auto md:w-2/4">
          <Search
            onSearch={handleSearch}
            placeholderText={t('form:input-placeholder-search-name')}
          />
        </div>
      </Card>

      <StaffList
        staffs={myStaffs}
        onPagination={handlePagination}
        paginatorInfo={paginatorInfo}
        onOrder={setOrder}
        onSort={setColumn}
      />
    </>
  );
}

MyStaffsPage.authenticate = {
  permissions: adminOnly,
};
MyStaffsPage.Layout = Layout;

export const getServerSideProps = async (context: any) => {
  const { fetchMyStaffsFromApi } = await import('@/data/server-api')
  const initialData = await fetchMyStaffsFromApi(context, {
    limit: 20,
    page: 1,
    orderBy: 'created_at',
    sortedBy: 'desc',
    is_active: true,
  })
  return {
    props: {
      ...(await serverSideTranslations(context.locale, ['table', 'common', 'form'])),
      initialMyStaffsData: initialData ?? null,
    },
  }
}
