import Card from '@/components/common/card';
import Layout from '@/components/layouts/admin';
import Search from '@/components/common/search';
import UserList from '@/components/user/user-list';
import LinkButton from '@/components/ui/link-button';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useUsersQuery } from '@/data/user';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Routes } from '@/config/routes';
import { SortOrder } from '@/types';
import { adminOnly } from '@/utils/auth-utils';
import PageHeading from '@/components/common/page-heading';

type AllUsersPageProps = {
  initialUsersData?: any
}

export default function AllUsersPage({ initialUsersData }: AllUsersPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { t } = useTranslation();

  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);

  const { users, paginatorInfo, loading, error } = useUsersQuery(
    {
      limit: 20,
      page,
      name: searchTerm,
      orderBy,
      sortedBy,
    },
    { initialData: initialUsersData }
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
          <PageHeading title={t('form:input-label-users')} />
        </div>

        <div className="flex w-full flex-col items-center space-y-4 ms-auto md:w-3/4 md:flex-row md:space-y-0 xl:w-2/4">
          <Search
            onSearch={handleSearch}
            placeholderText={t('form:input-placeholder-search-name')}
          />

          <LinkButton
            href={`${Routes.user.create}`}
            className="h-12 w-full md:w-auto md:ms-6"
          >
            <span>+ {t('form:button-label-add-user')}</span>
          </LinkButton>
        </div>
      </Card>

      {loading ? null : (
        <UserList
          customers={users}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      )}
    </>
  );
}

AllUsersPage.authenticate = {
  permissions: adminOnly,
};
AllUsersPage.Layout = Layout;

export const getServerSideProps = async (context: any) => {
  const { fetchUsersFromApi } = await import('@/data/server-api')
  const initialData = await fetchUsersFromApi(context, {
    limit: 20,
    page: 1,
    orderBy: 'created_at',
    sortedBy: 'desc',
  })
  return {
    props: {
      ...(await serverSideTranslations(context.locale, ['table', 'common', 'form'])),
      initialUsersData: initialData ?? null,
    },
  }
}
