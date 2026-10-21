import Search from '@/components/common/search';
import Layout from '@/components/layouts/admin';
import ShippingList from '@/components/shipping/shipping-list';
import ShippingsSummaryStrip from '@/components/shipping/shippings-summary-strip';
import DataPanel from '@/components/page/data-panel';
import { useState } from 'react';
import ErrorMessage from '@/components/ui/error-message';
import LinkActionButton from '@/components/ui/link-action-button';
import Loader from '@/components/ui/loader/loader';
import { Routes } from '@/config/routes';
import { useShippingClassesQuery } from '@/data/shipping';
import { SortOrder } from '@/types';
import { adminOnly } from '@/utils/auth-utils';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ShippingsPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearch] = useState('');
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { shippingClasses, loading, error } = useShippingClassesQuery({
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
      <ShippingsSummaryStrip
        totalShippings={shippingClasses?.length}
        matchingResults={shippingClasses?.length}
      />

      <DataPanel
        className="mb-0"
        title={t('form:input-label-shippings')}
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
              href={`${Routes.shipping.create}`}
              variant="primary"
              size="sm"
              className="w-full shrink-0 justify-center sm:w-auto"
            >
              + {t('form:button-label-add')} {t('form:button-label-shipping')}
            </LinkActionButton>
          </div>
        }
      >
        <ShippingList
          onOrder={setOrder}
          onSort={setColumn}
          shippings={shippingClasses}
        />
      </DataPanel>
    </div>
  );
}

ShippingsPage.authenticate = {
  permissions: adminOnly,
};

ShippingsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
