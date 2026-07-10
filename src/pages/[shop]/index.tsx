import ShopLayout from '@/components/layouts/shop';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useShopQuery } from '@/data/shop';
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
import ClothingImportAnnouncement from '@/components/product/clothing-import-announcement';
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

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  const {
    name,
    is_active,
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
  } = data ?? {};
  const timings = shopSettings?.timings;
  const canImportClothing =
    hasAccess(adminAndOwnerOnly, permissions) ||
    role === SUPER_ADMIN ||
    role === STORE_OWNER;

  return (
    <DashboardShell>
      <ClothingImportAnnouncement
        shop={shop as string}
        canShow={canImportClothing}
      />
      {!is_active && (
        <Alert
          message={t('common:text-permission-message')}
          variant="error"
        />
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
            <PaymentInfoList payment={balance?.payment_info as PaymentInfo} />
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
    ...(await serverSideTranslations(locale, ['form', 'common', 'table'])),
  },
});
export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: 'blocking' };
};
