import ShopLayout from '@/components/layouts/shop';
import { DashboardShell } from '@/components/dashboard/layout';
import DataPanel from '@/components/page/data-panel';
import {
  adminOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import Search from '@/components/common/search';
import LinkActionButton from '@/components/ui/link-action-button';
import { useState, useEffect } from 'react';
import { LIMIT } from '@/utils/constants';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Routes } from '@/config/routes';
import AuthorList from '@/components/author/author-list';
import AuthorsSummaryStrip from '@/components/author/authors-summary-strip';
import { useAuthorsQuery } from '@/data/author';
import { SortOrder } from '@/types';
import { Config } from '@/config';
import { useShopQuery } from '@/data/shop';
import { useMeQuery } from '@/data/user';

export default function Authors() {
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const { t } = useTranslation();
  const {
    query: { shop },
    locale,
  } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { authors, loading, paginatorInfo, error } = useAuthorsQuery({
    limit: LIMIT,
    sortedBy,
    orderBy,
    name: searchTerm,
    page,
    language: locale,
  });

  const { data: shopData } = useShopQuery({
    slug: shop as string,
  });
  const { id: shop_id } = shopData ?? {};

  useEffect(() => {
    if (me && shop_id) {
      if (
        !hasAccess(adminOnly, permissions) &&
        !me?.shops?.map((shop) => shop.id).includes(shop_id) &&
        me?.managed_shop?.id != shop_id
      ) {
        router.replace(Routes.dashboard);
      }
    }
  }, [me, shop_id, permissions, router]);

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
  }

  function handlePagination(current: number) {
    setPage(current);
  }

  return (
    <DashboardShell>
      <AuthorsSummaryStrip
        totalAuthors={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('common:text-authors')}
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
                href={`/${shop}${Routes.author.create}`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                + {t('form:button-label-add-author')}
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <AuthorList
          authors={authors}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </DashboardShell>
  );
}
Authors.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
Authors.Layout = ShopLayout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
}
