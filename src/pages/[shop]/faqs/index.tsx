import Search from '@/components/common/search';
import LinkActionButton from '@/components/ui/link-action-button';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { SortOrder } from '@/types';
import { Config } from '@/config';
import FaqsLists from '@/components/faqs/faqs-list';
import FaqsSummaryStrip from '@/components/faqs/faqs-summary-strip';
import DataPanel from '@/components/page/data-panel';
import { DashboardShell } from '@/components/dashboard/layout';
import { useFaqsQuery } from '@/data/faqs';
import { useShopQuery } from '@/data/shop';
import {
  adminOwnerAndStaffOnly,
  adminOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useMeQuery } from '@/data/user';
import { Routes } from '@/config/routes';
import ShopLayout from '@/components/layouts/shop';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Faqs() {
  // at first fetch related data (e.g. settings, shop, user, terms etc)
  // if vendor/staff/admin then it will run through permission code

  const { t } = useTranslation();
  const { locale } = useRouter();
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const {
    query: { shop },
  } = useRouter();
  const { data: shopData } = useShopQuery({ slug: shop as string });
  const shopId = shopData?.id!;

  const { faqs, loading, paginatorInfo, error } = useFaqsQuery({
    language: locale,
    limit: 20,
    page,
    faq_title: searchTerm,
    orderBy,
    sortedBy,
    shop_id: shopId,
  });

  const handleSearch = ({ searchText }: { searchText: string }) => {
    setSearchTerm(searchText);
    setPage(1);
  };

  const handlePagination = (current: number) => {
    setPage(current);
  };

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  if (
    !hasAccess(adminOnly, permissions) &&
    !me?.shops?.map((shop) => shop.id).includes(shopId) &&
    me?.managed_shop?.id != shopId
  ) {
    router.replace(Routes.dashboard);
  }

  return (
    <DashboardShell>
      <FaqsSummaryStrip
        totalFaqs={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('form:form-title-faqs')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            {locale === Config.defaultLanguage ? (
              <LinkActionButton
                href={`/${shop}/faqs/create`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                <span className="hidden xl:block">
                  + {t('form:button-label-add-faq')}
                </span>
                <span className="xl:hidden">+ {t('form:button-label-add')}</span>
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <FaqsLists
          faqs={faqs}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </DashboardShell>
  );
}

Faqs.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};

Faqs.Layout = ShopLayout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
}
