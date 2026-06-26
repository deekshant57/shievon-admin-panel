import { EditFillIcon } from '@/components/icons/edit';
import { MapPinIconWithPlatform } from '@/components/icons/map-pin';
import { PhoneIconNew } from '@/components/icons/phone';
import ShopLayout from '@/components/layouts/shop';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { Routes } from '@/config/routes';
import { useShopQuery } from '@/data/shop';
import {
  adminAndOwnerOnly,
  adminOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { formatAddress } from '@/utils/format-address';
import usePrice from '@/utils/use-price';
import dayjs from 'dayjs';
import isEmpty from 'lodash/isEmpty';
import { GetStaticPaths } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { EmailAtIcon } from '@/components/icons/email';
import { ExternalLinkIcon } from '@/components/icons/external-link';
import { StatMetric, StatStrip, Section } from '@/components/page';
import {
  ContentListHorizontal,
  ContentListVertical,
} from '@/components/shop-single/content-list';
import PaymentInfoList from '@/components/shop-single/payment-info';
import ShortDescription from '@/components/shop-single/short-description';
import ShopAvatar from '@/components/shop/shop-avatar';
import Alert from '@/components/ui/alert';
import Link from '@/components/ui/link';
import ClothingImportAnnouncement from '@/components/product/clothing-import-announcement';
import ProductBulkImportMenu from '@/components/product/product-bulk-import-menu';
import { OwnerShipTransferStatus, PaymentInfo } from '@/types';
import { useFormatPhoneNumber } from '@/utils/format-phone-number';
import { useSettingsQuery } from '@/data/settings';
import { IosArrowDown } from '@/components/icons/ios-arrow-down';
import {
  OWNERSHIP_TRANSFER_STATUS,
  STORE_OWNER,
  SUPER_ADMIN,
} from '@/utils/constants';

export default function ShopPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { permissions, role } = getAuthCredentials();
  const {
    query: { shop },
    locale,
  } = useRouter();
  const { settings } = useSettingsQuery({
    language: locale!,
  });
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

  const phoneNumber = useFormatPhoneNumber({
    customer_contact: data?.settings?.contact as string,
  });

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
    id: shop_id,
    ownership_history,
  } = data ?? {};
  const timings = shopSettings?.timings;
  const canImportClothing =
    hasAccess(adminAndOwnerOnly, permissions) ||
    role === SUPER_ADMIN ||
    role === STORE_OWNER;

  return (
    <div className="-m-5 md:-m-8">
      <ClothingImportAnnouncement
        shop={shop as string}
        canShow={canImportClothing}
      />
      {!is_active && (
        <Alert
          className="mb-4"
          message={t('common:text-permission-message')}
          variant="error"
        />
      )}
      {/* {settings?.options?.maintenance?.isUnderMaintenance && (
        <Alert
          className="mb-4"
          message="Site is under maintenance."
          variant="info"
        />
      )} */}
      <div className="relative h-28 overflow-hidden bg-card lg:h-32">
        <Image
          src={cover_image?.original ?? '/shop-fallback-cover-photo.png'}
          height={600}
          width={1200}
          sizes="(max-width: 768px) 100vw"
          alt={Object(name)}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="border-b border-border/60 bg-card px-4 py-5 lg:px-8 xl:px-10">
        <div className="flex flex-wrap items-start gap-4 lg:items-center lg:gap-6">
          <ShopAvatar
            is_active={is_active}
            name={name}
            logo={logo as any}
            size="medium"
          />
          <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-auto">
              <div className="mb-3 flex items-center gap-2">
                {name ? (
                  <h1 className="text-xl font-bold leading-none text-heading md:text-2xl">
                    {name}
                  </h1>
                ) : null}
                <Link
                  href={Routes.visitStore(`shops/${slug as string}`)}
                  target="_blank"
                  className="text-body transition-colors duration-200 hover:text-accent"
                >
                  <ExternalLinkIcon />
                </Link>
              </div>
              <div className="flex flex-col space-y-3 divide-border/60 leading-none xl:flex-row xl:space-y-0 xl:space-x-5 xl:divide-x">
                {owner?.email ? (
                  <ContentListHorizontal
                    content={owner?.email}
                    isLink
                    link={`mailto:${owner?.email}`}
                  >
                    <EmailAtIcon />
                  </ContentListHorizontal>
                ) : (
                  ''
                )}

                {!isEmpty(formatAddress(address!)) ? (
                  <ContentListHorizontal
                    content={formatAddress(address!) as string}
                    className="xl:pl-5"
                    link={`https://www.google.com/maps/place/${formatAddress(
                      address!,
                    )}`}
                    isLink
                  >
                    <MapPinIconWithPlatform />
                  </ContentListHorizontal>
                ) : (
                  ''
                )}

                {phoneNumber ? (
                  <ContentListHorizontal
                    content={phoneNumber}
                    isLink
                    className="xl:pl-5"
                    link={`tel:${phoneNumber}`}
                  >
                    <PhoneIconNew />
                  </ContentListHorizontal>
                ) : (
                  ''
                )}
              </div>
            </div>
            {canImportClothing && (
              <div className="flex items-center gap-4 self-end pt-4 xl:pt-0">
                <ProductBulkImportMenu
                  shop={shop as string}
                  variant="pill"
                />
                <Link
                  className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-light hover:bg-accent-hover"
                  href={`/${shop}/edit`}
                >
                  <EditFillIcon />
                  {t('common:text-edit-shop')}
                </Link>

                {/*
                  Hidden in vendor portal:
                  Transfer Ownership button next to "Edit shop".
                  (Code kept intentionally, only commented.)
                */}
                {/* {!OWNERSHIP_TRANSFER_STATUS?.includes(
                  ownership_history?.status as OwnerShipTransferStatus,
                ) ? (
                  <Link
                    className="inline-flex items-center gap-1 rounded-full bg-accent px-[0.625rem] py-[0.5625rem] text-xs font-medium text-white hover:bg-accent-hover"
                    href={`/${shop}/transfer-ownership`}
                  >
                    <IosArrowDown />
                    {t('common:text-transfer-shop-ownership')}
                  </Link>
                ) : (
                  ''
                )} */}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-8 lg:px-8 xl:px-10">
        <StatStrip columns={role !== 'staff' ? 5 : 2}>
          <StatMetric
            label={t('common:text-total-products')}
            value={products_count?.toString() as string}
          />
          <StatMetric
            label={t('common:text-total-orders')}
            value={orders_count?.toString() as string}
          />
          {role !== 'staff' ? (
            <>
              <StatMetric
                label={t('common:text-commission-rate')}
                value={`${balance?.admin_commission_rate ?? 0}%`}
              />
              <StatMetric
                label={t('common:text-gross-sales')}
                value={totalEarnings as string}
              />
              <StatMetric
                label={t('common:text-current-balance')}
                value={currentBalance as string}
              />
            </>
          ) : null}
        </StatStrip>

        <div className="grid gap-6 lg:grid-cols-3">
          <Section className="lg:col-span-1" contentClassName="space-y-5">
            <ContentListVertical
              title={t('common:text-registered-since')}
              content={dayjs(created_at).format('MMMM D, YYYY')}
            />

            {description ? (
              <div>
                <h2 className="mb-3 text-base font-bold text-heading">
                  {t('common:text-bio')}
                </h2>
                <ShortDescription content={description} character={90} />
              </div>
            ) : null}

            {timings?.open && timings?.close ? (
              <div>
                <h2 className="mb-3 text-base font-bold text-heading">
                  {t('common:text-opening-hours')}
                </h2>
                <p className="text-body">
                  {timings.open} – {timings.close}
                </p>
              </div>
            ) : null}
          </Section>

          <Section
            title={t('common:text-payment-info')}
            className="lg:col-span-2"
          >
            <PaymentInfoList payment={balance?.payment_info as PaymentInfo} />
          </Section>
        </div>
      </div>
    </div>
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
