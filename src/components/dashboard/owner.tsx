import ColumnChart from '@/components/widgets/column-chart';
import {
  useAnalyticsQuery,
} from '@/data/dashboard';
import {
  adminOnly,
  adminAndOwnerOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import usePrice from '@/utils/use-price';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import {
  DashboardHeader,
  DashboardKpiBento,
  DashboardSection,
  DashboardShell,
  OrderStatusSection,
  WidgetGrid,
  WidgetGridItem,
} from '@/components/dashboard/layout';

const ShopList = dynamic(() => import('@/components/dashboard/shops/shops'));

const OwnerShopLayout = () => {
  const { t } = useTranslation();
  const { permissions } = getAuthCredentials();
  const { data } = useAnalyticsQuery(true);

  const { price: total_revenue } = usePrice(
    data && {
      amount: data?.totalRevenue!,
    },
  );
  const { price: total_refund } = usePrice(
    data && {
      amount: data?.totalRefunds!,
    },
  );

  const { price: todays_revenue } = usePrice(
    data && {
      amount: data?.todaysRevenue!,
    },
  );

  let salesByYear: number[] = Array.from({ length: 12 }, (_) => 0);
  if (!!data?.totalYearSaleByMonth?.length) {
    salesByYear = data.totalYearSaleByMonth.map((item: any) =>
      item.total.toFixed(2),
    );
  }

  const monthCategories = useMemo(
    () => [
      t('common:january'),
      t('common:february'),
      t('common:march'),
      t('common:april'),
      t('common:may'),
      t('common:june'),
      t('common:july'),
      t('common:august'),
      t('common:september'),
      t('common:october'),
      t('common:november'),
      t('common:december'),
    ],
    [t],
  );

  const sparkline = useMemo(
    () =>
      salesByYear.map((value, index) => ({
        label: monthCategories[index]?.slice(0, 3) ?? '',
        value: Number(value) || 0,
      })),
    [monthCategories, salesByYear],
  );

  return (
    <DashboardShell variant="vendor">
      <DashboardHeader variant="vendor" />

      <DashboardKpiBento
        variant="vendor"
        totalRevenue={total_revenue}
        sparkline={sparkline}
        totalRefunds={total_refund}
        totalShops={data?.totalShops}
        todaysRevenue={todays_revenue}
      />

      <OrderStatusSection
        analyticsData={data}
        allowedStatus={['pending', 'processing', 'complete', 'cancel']}
      />

      {hasAccess(adminAndOwnerOnly, permissions) ? (
        <WidgetGrid>
          <WidgetGridItem span={12}>
            <DashboardSection
              title={t('common:sale-history')}
              contentClassName="!p-0 !pt-0 md:!px-2 md:!pb-2"
            >
              <ColumnChart
                hideHeader
                colors={['hsl(357,73%,48%)']}
                series={salesByYear}
                categories={[
                  t('common:january'),
                  t('common:february'),
                  t('common:march'),
                  t('common:april'),
                  t('common:may'),
                  t('common:june'),
                  t('common:july'),
                  t('common:august'),
                  t('common:september'),
                  t('common:october'),
                  t('common:november'),
                  t('common:december'),
                ]}
              />
            </DashboardSection>
          </WidgetGridItem>
        </WidgetGrid>
      ) : null}
    </DashboardShell>
  );
};

const OwnerDashboard = () => {
  const { t } = useTranslation();
  const { permissions } = getAuthCredentials();
  const permission = hasAccess(adminOnly, permissions);

  if (permission) {
    return (
      <DashboardShell variant="vendor">
        <DashboardHeader
          variant="vendor"
          title={t('common:sidebar-nav-item-my-shops')}
          subtitle={
            t('dashboard-subtitle-my-shops') ||
            'Select a shop to open its dashboard'
          }
          hideActions
        />
        <ShopList hideTitle />
      </DashboardShell>
    );
  }

  return <OwnerShopLayout />;
};

export default OwnerDashboard;
