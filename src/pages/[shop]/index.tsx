import ShopLayout from '@/components/layouts/shop';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useShopQuery, useToggleServiceabilityMutation } from '@/data/shop';
import { useVendorSettlementQuery } from '@/data/vendor-settlement';
import {
  adminAndOwnerOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import usePrice from '@/utils/use-price';
import dayjs from 'dayjs';
import { GetStaticPaths } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { Section } from '@/components/page';
import {
  ContentListVertical,
} from '@/components/shop-single/content-list';
import PaymentInfoList from '@/components/shop-single/payment-info';
import ShortDescription from '@/components/shop-single/short-description';
import ShopProfileHero from '@/components/shop/shop-profile-hero';
import ShopKpiStrip from '@/components/shop/shop-kpi-strip';
import Alert from '@/components/ui/alert';
import { PaymentInfo } from '@/types';
import {
  STORE_OWNER,
  SUPER_ADMIN,
} from '@/utils/constants';
import {
  DashboardSection,
  DashboardShell,
  WidgetGrid,
  WidgetGridItem,
} from '@/components/dashboard/layout';
import { Switch } from '@headlessui/react';
import {
  getServiceStatus,
  getNextOpenTime,
  ServiceStatus,
} from '@/utils/serviceability';
import { Routes } from '@/config/routes';

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  open: {
    label: 'common:text-shop-open',
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  closed_manual: {
    label: 'common:text-shop-closed-manual',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  closed_schedule: {
    label: 'common:text-shop-closed-schedule',
    dotColor: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
};

export default function ShopPage() {
  const { t } = useTranslation();
  const { permissions, role } = getAuthCredentials();
  const {
    query: { shop },
  } = useRouter();
  const {
    data,
    isLoading: loading,
    error,
  } = useShopQuery({
    slug: shop!.toString(),
  });

  const { mutate: toggleServiceability, isLoading: toggling } =
    useToggleServiceabilityMutation();

  const { settlement, error: settlementError } = useVendorSettlementQuery(
    data?.id,
    { retry: false },
  );

  const { price: totalEarnings } = usePrice(
    data && {
      amount: data?.balance?.total_earnings!,
    },
  );
  const { price: currentBalance } = usePrice(
    data && {
      amount: data?.balance?.current_balance!,
    },
  );

  const receivedAmount = settlement?.received ?? 0;
  const settlementTotal = settlement?.total_earnings ?? 0;
  const { price: receivedPrice } = usePrice({
    amount: receivedAmount,
  });
  const { price: settlementTotalPrice } = usePrice({
    amount: settlementTotal,
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

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  const {
    id,
    name,
    is_active,
    is_serviceable,
    logo,
    cover_image,
    description,
    products_count,
    orders_count,
    balance,
    address,
    settings: shopSettings,
    created_at,
    slug,
    owner,
    timezone,
  } = data ?? {};
  const timings = shopSettings?.timings;
  const canImportClothing =
    hasAccess(adminAndOwnerOnly, permissions) ||
    role === SUPER_ADMIN ||
    role === STORE_OWNER;

  const isOwner = role === STORE_OWNER || role === SUPER_ADMIN;

  const serviceStatus = getServiceStatus(
    is_serviceable,
    shopSettings?.serviceSchedule,
    timezone,
  );
  const statusConfig = STATUS_CONFIG[serviceStatus];
  const nextOpenTime =
    serviceStatus !== 'open'
      ? getNextOpenTime(shopSettings?.serviceSchedule, timezone)
      : null;

  const handleToggleServiceability = () => {
    if (!id || toggling) return;
    toggleServiceability({ id, is_serviceable: !is_serviceable });
  };

  const paymentInfo =
    (settlement?.payment_info as PaymentInfo | undefined) ??
    (balance?.payment_info as PaymentInfo | undefined);

  const withdrawsHref = shop
    ? `/${shop}${Routes.withdraw.list}`
    : undefined;
  const etaMessage =
    settlement?.settlement_eta_message ||
    (t('common:text-settlement-eta') as string) ||
    'Bank transfer may take up to 5 working days.';

  return (
    <DashboardShell>
      {!is_active && (
        <Alert
          message={t('common:text-permission-message')}
          variant="error"
        />
      )}

      {isOwner && is_active && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-4">
            <Switch
              checked={!!is_serviceable}
              onChange={handleToggleServiceability}
              disabled={toggling}
              className={`${
                is_serviceable ? 'bg-accent' : 'bg-gray-300'
              } relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none ${
                toggling ? 'cursor-not-allowed opacity-60' : ''
              }`}
              dir="ltr"
            >
              <span className="sr-only">{t('common:text-accepting-orders')}</span>
              <span
                className={`${
                  is_serviceable ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-light transition-transform`}
              />
            </Switch>
            <span className="text-sm font-medium text-heading">
              {t('common:text-accepting-orders')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 ${statusConfig.bgColor}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`}
              />
              <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                {t(statusConfig.label)}
              </span>
            </div>
            {nextOpenTime && (
              <span className="text-xs text-muted-foreground">
                {t('common:text-next-opens-at')}: {nextOpenTime}
              </span>
            )}
          </div>
        </div>
      )}

      <ShopProfileHero
        name={name}
        slug={slug}
        is_active={is_active}
        logo={logo}
        cover_image={cover_image}
        owner={owner}
        address={address}
        settings={shopSettings}
        shopSlug={shop as string}
        canEdit={canImportClothing}
      />

      <ShopKpiStrip
        productsCount={products_count}
        ordersCount={orders_count}
        commissionRate={balance?.admin_commission_rate}
        grossSales={totalEarnings}
        currentBalance={currentBalance}
        showFinancials={role !== 'staff'}
        receivedTotal={
          settlement && !settlementError
            ? `${receivedPrice} / ${settlementTotalPrice}`
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
        withdrawsHref={withdrawsHref}
      />

      <WidgetGrid>
        <WidgetGridItem span={4}>
          <Section contentClassName="space-y-5">
            <ContentListVertical
              title={t('common:text-registered-since')}
              content={dayjs(created_at).format('MMMM D, YYYY')}
            />

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('common:text-bio')}
              </h2>
              {description?.trim() ? (
                <ShortDescription content={description} character={90} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('common:text-no-bio')}
                </p>
              )}
            </div>

            {timings?.open && timings?.close ? (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('common:text-opening-hours')}
                </h2>
                <p className="text-body">
                  {timings.open} – {timings.close}
                </p>
              </div>
            ) : null}
          </Section>
        </WidgetGridItem>

        <WidgetGridItem span={8}>
          <DashboardSection title={t('common:text-payment-info')}>
            <PaymentInfoList payment={paymentInfo} />
          </DashboardSection>
        </WidgetGridItem>
      </WidgetGrid>
    </DashboardShell>
  );
}
ShopPage.Layout = ShopLayout;
ShopPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['form', 'common', 'table'])),
  },
});
export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
};
