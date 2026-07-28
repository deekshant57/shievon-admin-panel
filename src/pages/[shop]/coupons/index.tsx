import Search from '@/components/common/search';
import CouponList from '@/components/coupon/coupon-list';
import CouponsSummaryStrip from '@/components/coupon/coupons-summary-strip';
import { DashboardShell } from '@/components/dashboard/layout';
import ShopLayout from '@/components/layouts/shop';
import DataPanel from '@/components/page/data-panel';
import ErrorMessage from '@/components/ui/error-message';
import LinkActionButton from '@/components/ui/link-action-button';
import Loader from '@/components/ui/loader/loader';
import { Config } from '@/config';
import { Routes } from '@/config/routes';
import { useCouponsQuery } from '@/data/coupon';
import { useSettingsQuery } from '@/data/settings';
import { useShopQuery } from '@/data/shop';
import { SortOrder } from '@/types';
import { adminOwnerAndStaffOnly, getAuthCredentials } from '@/utils/auth-utils';
import { STAFF, STORE_OWNER, SUPER_ADMIN } from '@/utils/constants';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

export default function Coupons() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const { role } = getAuthCredentials();
  const router = useRouter();
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const [searchCoupon, setSearchCoupon] = useState('');
  const [page, setPage] = useState(1);
  const hasRedirectedRef = useRef(false);
  const {
    query: { shop },
  } = useRouter();
  const { data: shopData } = useShopQuery({ slug: shop as string });
  const shopId = shopData?.id!;
  const { settings, loading: settingsLoading } = useSettingsQuery({
    language: locale!,
  });
  const { coupons, loading, paginatorInfo, error } = useCouponsQuery({
    language: locale,
    limit: 20,
    page,
    code: searchCoupon,
    orderBy,
    sortedBy,
    shop_id: shopId,
  });

  // Check permissions and redirect if user doesn't have access
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Wait for settings to be loaded before checking
    if (settingsLoading || !settings) {
      return;
    }

    // Check if user has required role and coupons are enabled
    const hasRequiredRole =
      role === STAFF || role === STORE_OWNER || role === SUPER_ADMIN;
    const couponsEnabled = settings?.options?.enableCoupons;

    // Only redirect if user doesn't have required role or coupons are disabled
    if (!hasRequiredRole || !couponsEnabled) {
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [settingsLoading, settings, role, router]);

  if (loading || settingsLoading)
    return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchCoupon(searchText);
    setPage(1);
  }

  function handlePagination(current: number) {
    setPage(current);
  }

  return (
    <DashboardShell>
      <CouponsSummaryStrip
        totalCoupons={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
      />

      <DataPanel
        className="mb-0"
        title={t('form:input-label-coupons')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Search
              onSearch={handleSearch}
              placeholderText={t('form:input-placeholder-search-code')}
              debounceMs={400}
              variant="hybrid"
              size="sm"
              className="w-full min-w-0 sm:flex-1"
            />
            {locale === Config.defaultLanguage && role !== STAFF ? (
              <LinkActionButton
                href={`/${shop}/coupons/create`}
                variant="primary"
                size="sm"
                className="w-full shrink-0 justify-center sm:w-auto"
              >
                + {t('form:button-label-add-coupon')}
              </LinkActionButton>
            ) : null}
          </div>
        }
      >
        <CouponList
          coupons={coupons}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </DashboardShell>
  );
}

Coupons.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};

Coupons.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
