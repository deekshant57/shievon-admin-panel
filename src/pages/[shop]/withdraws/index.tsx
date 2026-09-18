import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import WithdrawList from '@/components/withdraw/withdraw-list';
import WithdrawsSummaryStrip from '@/components/withdraw/withdraws-summary-strip';
import ShopLayout from '@/components/layouts/shop';
import { DashboardShell } from '@/components/dashboard/layout';
import DataPanel from '@/components/page/data-panel';
import { useRouter } from 'next/router';
import {
  adminAndOwnerOnly,
  getAuthCredentials,
} from '@/utils/auth-utils';
import { evaluateShopAccess } from '@/utils/shop-access';
import { useShopQuery } from '@/data/shop';
import { useWithdrawsQuery } from '@/data/withdraw';
import { useVendorSettlementQuery } from '@/data/vendor-settlement';
import { useState, useEffect, useRef } from 'react';
import { SortOrder } from '@/types';
import { Routes } from '@/config/routes';
import { useMeQuery } from '@/data/user';
import usePrice from '@/utils/use-price';
import Alert from '@/components/ui/alert';
import Link from '@/components/ui/link';

export default function WithdrawsPage() {
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me, isLoading: loadingMe } = useMeQuery();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [orderBy, setOrder] = useState('created_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const {
    query: { shop },
  } = useRouter();
  const { data: shopData, isLoading: fetchingShop } = useShopQuery({
    slug: shop as string,
  });
  const shopId = shopData?.id;
  const hasRedirectedRef = useRef(false);

  const { withdraws, paginatorInfo, loading, error } = useWithdrawsQuery(
    {
      shop_id: shopId as any,
      limit: 10,
      page,
      orderBy,
      sortedBy,
    },
    {
      enabled: Boolean(shopId),
    },
  );

  const { settlement, error: settlementError } = useVendorSettlementQuery(
    shopId,
    {
      enabled: Boolean(shopId),
      retry: false,
    },
  );

  const { price: receivedPrice } = usePrice({
    amount: settlement?.received ?? 0,
  });
  const { price: totalEarningsPrice } = usePrice({
    amount: settlement?.total_earnings ?? 0,
  });
  const { price: pendingPrice } = usePrice({
    amount: settlement?.pending ?? 0,
  });
  const { price: todaysCollectionPrice } = usePrice({
    amount: settlement?.todays_collection ?? 0,
  });
  const { price: totalCollectionPrice } = usePrice({
    amount: settlement?.total_collection ?? 0,
  });

  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }

    if (fetchingShop || loadingMe || !shopId || !me) {
      // eslint-disable-next-line no-console
      console.info('[payouts] waiting for access inputs', {
        fetchingShop,
        loadingMe,
        shopId,
        hasMe: Boolean(me),
        shopSlug: shop,
      });
      return;
    }

    const access = evaluateShopAccess({
      me,
      shopId,
      shop: shopData,
      permissions,
      context: 'payouts-list',
    });

    if (!access.allowed) {
      // eslint-disable-next-line no-console
      console.warn('[payouts] redirecting to dashboard — access denied', {
        reason: access.reason,
        shopSlug: shop,
        shopId,
        path: router.asPath,
      });
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [
    fetchingShop,
    loadingMe,
    shopId,
    me,
    shopData,
    permissions,
    router,
    shop,
  ]);

  if (loading || fetchingShop || loadingMe) {
    return <Loader text={t('common:text-loading')} />;
  }
  if (error) return <ErrorMessage message={error.message} />;

  function handlePagination(current: any) {
    setPage(current);
  }

  const etaMessage =
    settlement?.settlement_eta_message ||
    t('common:text-settlement-eta') ||
    'Bank transfer may take up to 5 working days.';

  const paymentInfo =
    settlement?.payment_info ?? shopData?.balance?.payment_info;
  const hasAnyBankField = Boolean(
    paymentInfo?.name ||
      paymentInfo?.bank ||
      paymentInfo?.account ||
      paymentInfo?.ifsc,
  );
  const paymentSettingsHref = shop ? `/${shop}/edit` : '/';

  return (
    <DashboardShell>
      <WithdrawsSummaryStrip
        totalWithdraws={paginatorInfo?.total}
        matchingResults={paginatorInfo?.total}
        receivedTotal={
          settlement && !settlementError
            ? `${receivedPrice} / ${totalEarningsPrice}`
            : undefined
        }
        pending={settlement && !settlementError ? pendingPrice : undefined}
        todaysCollection={
          settlement && !settlementError ? todaysCollectionPrice : undefined
        }
        totalCollection={
          settlement && !settlementError ? totalCollectionPrice : undefined
        }
        settlementEtaMessage={
          settlement && !settlementError ? etaMessage : undefined
        }
      />

      {!hasAnyBankField ? (
        <Alert
          message={
            (t('common:text-add-bank-details-hint') as string) ||
            'Add your bank details in shop settings so admins can pay you out. You can still view settlement history without them.'
          }
          variant="info"
          className="mb-4"
        >
          <Link
            href={paymentSettingsHref}
            className="mt-2 inline-block font-semibold text-accent underline"
          >
            {t('form:link-edit-payment-info') || 'Edit payment info'}
          </Link>
        </Alert>
      ) : null}

      {settlementError ? (
        <Alert
          message={
            (t('common:text-settlement-unavailable') as string) ||
            'Settlement summary is temporarily unavailable. Payout history below still works.'
          }
          variant="warning"
          className="mb-4"
        />
      ) : null}

      <DataPanel
        className="mb-0"
        title={t('common:sidebar-nav-item-withdraws')}
        subtitle={etaMessage}
        toolbarLayout="stacked"
      >
        <WithdrawList
          withdraws={withdraws}
          paginatorInfo={paginatorInfo}
          onPagination={handlePagination}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </DashboardShell>
  );
}
WithdrawsPage.authenticate = {
  permissions: adminAndOwnerOnly,
};
WithdrawsPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
