import Layout from '@/components/layouts/admin';
import Search from '@/components/common/search';
import LinkActionButton from '@/components/ui/link-action-button';
import DataPanel from '@/components/page/data-panel';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import TagList from '@/components/tag/tag-list';
import TagsSummaryStrip from '@/components/tag/tags-summary-strip';
import { adminOnly } from '@/utils/auth-utils';
import { SortOrder, Type } from '@/types';
import { Routes } from '@/config/routes';
import { useTagsQuery } from '@/data/tag';
import { useRouter } from 'next/router';
import { Config } from '@/config';
import TypeFilter from '@/components/category/type-filter';

export default function Tags() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const {
    tags,
    loading: loading,
    paginatorInfo,
    error,
  } = useTagsQuery({
    limit: 10,
    orderBy,
    sortedBy,
    name: searchTerm,
    page,
    language: locale,
    type,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <TagsSummaryStrip
        totalTags={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('common:sidebar-nav-item-tags')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-name')}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 lg:flex-1"
            />
            <TypeFilter
              className="w-full shrink-0 lg:w-56"
              onTypeFilter={(type: Type) => {
                setType(type?.slug!);
                setPage(1);
              }}
            />
            {locale === Config.defaultLanguage ? (
              <LinkActionButton
                href={`${Routes.tag.create}`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center lg:w-auto"
              >
                <span className="block md:hidden xl:block">
                  + {t('form:button-label-add-tag')}
                </span>
                <span className="hidden md:block xl:hidden">
                  + {t('form:button-label-add')}
                </span>
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <TagList
          tags={tags}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
          paginatorInfo={paginatorInfo}
        />
      </DataPanel>
    </div>
  );
}
Tags.authenticate = {
  permissions: adminOnly,
};
Tags.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['form', 'common', 'table'])),
  },
});
