import Layout from '@/components/layouts/admin';
import Search from '@/components/common/search';
import TaxList from '@/components/tax/tax-list';
import TaxesSummaryStrip from '@/components/tax/taxes-summary-strip';
import DataPanel from '@/components/page/data-panel';
import ErrorMessage from '@/components/ui/error-message';
import LinkActionButton from '@/components/ui/link-action-button';
import Loader from '@/components/ui/loader/loader';
import { useTaxesQuery } from '@/data/tax';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Routes } from '@/config/routes';
import { SortOrder } from '@/types';
import { adminOnly } from '@/utils/auth-utils';

export default function TaxesPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearch] = useState('');
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { taxes, loading, error } = useTaxesQuery({
    name: searchTerm,
    orderBy,
    sortedBy,
  });
  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearch(searchText);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <TaxesSummaryStrip
        totalTaxes={taxes?.length}
        matchingResults={taxes?.length}
      />

      <DataPanel
        className="mb-0"
        title={t('form:input-label-taxes')}
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
              href={`${Routes.tax.create}`}
              variant="primary"
              size="sm"
              className="w-full shrink-0 justify-center sm:w-auto"
            >
              + {t('form:button-label-add-tax')}
            </LinkActionButton>
          </div>
        }
      >
        {!loading ? (
          <TaxList taxes={taxes} onOrder={setOrder} onSort={setColumn} />
        ) : null}
      </DataPanel>
    </div>
  );
}

TaxesPage.authenticate = {
  permissions: adminOnly,
};
TaxesPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
