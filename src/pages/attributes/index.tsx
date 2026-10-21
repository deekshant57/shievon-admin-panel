import Layout from '@/components/layouts/admin';
import AttributeList from '@/components/attribute/attribute-list';
import AttributesSummaryStrip from '@/components/attribute/attributes-summary-strip';
import DataPanel from '@/components/page/data-panel';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { SortOrder } from '@/types';
import { useState } from 'react';
import { adminOnly } from '@/utils/auth-utils';
import { useRouter } from 'next/router';
import { useAttributesQuery } from '@/data/attributes';

export default function AttributePage() {
  const { t } = useTranslation();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { locale } = useRouter();

  const { attributes, loading, error } = useAttributesQuery({
    orderBy,
    sortedBy,
    language: locale,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;
  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <AttributesSummaryStrip
        totalAttributes={attributes?.length}
        matchingResults={attributes?.length}
      />

      <DataPanel
        className="mb-0"
        title={t('common:sidebar-nav-item-attributes')}
        toolbarLayout="stacked"
      >
        <AttributeList
          attributes={attributes}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </div>
  );
}

AttributePage.authenticate = {
  permissions: adminOnly,
};

AttributePage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
