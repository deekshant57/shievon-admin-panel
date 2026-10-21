import Search from '@/components/common/search';
import TypeList from '@/components/group/group-list';
import GroupsSummaryStrip from '@/components/group/groups-summary-strip';
import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import ErrorMessage from '@/components/ui/error-message';
import LinkActionButton from '@/components/ui/link-action-button';
import Loader from '@/components/ui/loader/loader';
import { Config } from '@/config';
import { Routes } from '@/config/routes';
import { useTypesQuery } from '@/data/type';
import { adminOnly } from '@/utils/auth-utils';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function TypesPage() {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const { types, loading, error } = useTypesQuery({
    name: searchTerm,
    language: locale,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <GroupsSummaryStrip
        totalGroups={types?.length}
        matchingResults={types?.length}
      />

      <DataPanel
        className="mb-0"
        title={t('common:sidebar-nav-item-groups')}
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
                href={Routes.type.create}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                <span className="block md:hidden xl:block">
                  + {t('form:button-label-add-type')}
                </span>
                <span className="hidden md:block xl:hidden">
                  + {t('form:button-label-add')}
                </span>
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <TypeList types={types} />
      </DataPanel>
    </div>
  );
}

TypesPage.authenticate = {
  permissions: adminOnly,
};

TypesPage.Layout = Layout;

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
