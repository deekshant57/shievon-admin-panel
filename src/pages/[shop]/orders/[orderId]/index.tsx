import Image from 'next/image';
import { Table } from '@/components/ui/table';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import ErrorMessage from '@/components/ui/error-message';
import { siteSettings } from '@/settings/site.settings';
import usePrice from '@/utils/use-price';
import { formatAddress } from '@/utils/format-address';
import Loader from '@/components/ui/loader/loader';
import ValidationError from '@/components/ui/form-validation-error';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import SelectInput from '@/components/ui/select-input';
import ShopLayout from '@/components/layouts/shop';
import { NoDataFound } from '@/components/icons/no-data-found';
import { useIsRTL } from '@/utils/locals';
import {
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import {
  // useDownloadInvoiceMutation,
  useUpdateOrderMutation,
  useOrderQuery,
} from '@/data/order';
import { Attachment, OrderStatus, PaymentStatus } from '@/types';
// import { DownloadIcon } from '@/components/icons/download-icon';
import OrderViewHeader from '@/components/order/order-view-header';
import OrderFulfillmentSection from '@/components/order/order-fulfillment-section';
import { ORDER_STATUS } from '@/utils/order-status';
import { hasFulfillmentFlow } from '@/utils/order-fulfillment';
import OrderStatusProgressBox from '@/components/order/order-status-progress-box';
import { Routes } from '@/config/routes';
import { useShopQuery } from '@/data/shop';
import { useMeQuery } from '@/data/user';
import { useFormatPhoneNumber } from '@/utils/format-phone-number';
import { useEffect, useMemo, useRef } from 'react';
import PageHeader from '@/components/page/page-header';
import Section from '@/components/page/section';
import ActionButton from '@/components/ui/action-button';

type FormValues = {
  order_status: any;
};
export default function OrderDetailsPage() {
  const { t } = useTranslation();
  const { locale, query } = useRouter();
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const { data: me } = useMeQuery();
  const { data: shopData, isLoading: fetchingShop } = useShopQuery({
    slug: query?.shop as string,
  });
  const shopId = shopData?.id!;
  const hasRedirectedRef = useRef(false);
  const { alignLeft, alignRight /*, isRTL */ } = useIsRTL();
  const { mutate: updateOrder, isLoading: updating } = useUpdateOrderMutation();
  const {
    order,
    isLoading: loading,
    error,
    refetch: refetchOrder,
  } = useOrderQuery({ id: query.orderId as string, language: locale! });
  // Static invoice download — temporarily disabled
  // const { refetch } = useDownloadInvoiceMutation(
  //   {
  //     order_id: query.orderId as string,
  //     language: locale!,
  //     isRTL,
  //   },
  //   { enabled: false },
  // );

  const {
    handleSubmit,
    control,

    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { order_status: order?.order_status ?? '' },
  });

  // async function handleDownloadInvoice() {
  //   const { data } = await refetch();

  //   if (data) {
  //     const a = document.createElement('a');
  //     a.href = data;
  //     a.setAttribute('download', 'order-invoice');
  //     a.click();
  //   }
  // }

  const ChangeStatus = ({ order_status }: FormValues) => {
    updateOrder({
      id: order?.id as string,
      order_status: order_status?.status as string,
    });
  };
  const { price: subtotal } = usePrice(
    order && {
      amount: order?.amount!,
    },
  );
  const { price: total } = usePrice(
    order && {
      amount: order?.paid_total!,
    },
  );
  const { price: discount } = usePrice(
    order && {
      amount: order?.discount!,
    },
  );
  const { price: delivery_fee } = usePrice(
    order && {
      amount: order?.delivery_fee!,
    },
  );
  const { price: sales_tax } = usePrice(
    order && {
      amount: order?.sales_tax!,
    },
  );

  const phoneNumber = useFormatPhoneNumber({
    customer_contact: order?.customer_contact as string,
  });
  const showFulfillmentUi = hasFulfillmentFlow(order);
  const legacyStatusOptions = useMemo(() => {
    return ORDER_STATUS.slice(0, 6);
  }, []);

  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }

    if (fetchingShop || !shopId || !me || loading) {
      return;
    }

    const hasRequiredPermission = hasAccess(
      adminOwnerAndStaffOnly,
      permissions,
    );
    const ownsShop =
      me?.shops?.some((shop) => String(shop.id) === String(shopId)) ?? false;
    const isManagedShop =
      me?.managed_shop?.id != null &&
      String(me.managed_shop.id) === String(shopId);

    if (!hasRequiredPermission && !ownsShop && !isManagedShop) {
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [fetchingShop, shopId, me, permissions, router, loading]);

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!order) return <ErrorMessage message={t('common:no-order-found')} />;

  const columns = [
    {
      dataIndex: 'image',
      key: 'image',
      width: 70,
      render: (image: Attachment) => (
        <Image
          src={image?.thumbnail ?? siteSettings.product.placeholder}
          alt="alt text"
          width={50}
          height={50}
        />
      ),
    },
    {
      title: t('table:table-item-products'),
      dataIndex: 'name',
      key: 'name',
      align: alignLeft,
      render: (name: string, item: any) => (
        <div>
          <span>{name}</span>
          <span className="mx-2">x</span>
          <span className="font-semibold text-heading">
            {item.pivot.order_quantity}
          </span>
        </div>
      ),
    },
    {
      title: t('table:table-item-total'),
      dataIndex: 'pivot',
      key: 'pivot',
      align: alignRight,
      render: function Render(pivot: any) {
        const { price } = usePrice({
          amount: Number(pivot?.subtotal),
        });
        return <span>{price}</span>;
      },
    },
  ];

  const canChangeStatus =
    !showFulfillmentUi &&
    ![
      OrderStatus.FAILED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
      OrderStatus.COMPLETED,
    ].includes(order?.order_status! as OrderStatus);

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title={`${t('form:input-label-order-id')} - ${order?.tracking_number}`}
        subtitle={t('common:order-details-subtitle')}
      />
      {/* Static invoice download — temporarily disabled
      <ActionButton
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleDownloadInvoice}
        className="w-full justify-center sm:w-auto"
      >
        <DownloadIcon className="h-4 w-4 shrink-0" />
        {t('common:text-download')} {t('common:text-invoice')}
      </ActionButton>
      */}

      <Section className="mb-0 overflow-hidden">
        <div className="-mx-6 -mt-6 mb-6 md:-mx-6">
          <OrderViewHeader order={order} wrapperClassName="px-6 py-4 md:px-8" />
        </div>

        {canChangeStatus ? (
          <form
            onSubmit={handleSubmit(ChangeStatus)}
            className="mb-6 flex w-full flex-col gap-3 sm:flex-row sm:items-start"
          >
            <div className="z-20 w-full min-w-0 flex-1">
              <SelectInput
                name="order_status"
                control={control}
                getOptionLabel={(option: any) => t(option.name)}
                getOptionValue={(option: any) => option.status}
                options={legacyStatusOptions}
                placeholder={t('form:input-placeholder-order-status')}
              />
              <ValidationError message={t(errors?.order_status?.message)} />
            </div>
            <ActionButton
              type="submit"
              variant="primary"
              size="sm"
              loading={updating}
              disabled={updating}
              className="w-full shrink-0 justify-center sm:w-auto"
            >
              <span className="hidden sm:block">
                {t('form:button-label-change-status')}
              </span>
              <span className="block sm:hidden">
                {t('form:form:button-label-change')}
              </span>
            </ActionButton>
          </form>
        ) : null}

        {showFulfillmentUi ? (
          <OrderFulfillmentSection
            order={order}
            shop={shopData}
            refetchOrder={refetchOrder}
          />
        ) : (
          <div className="my-5 flex items-center justify-center lg:my-8">
            <OrderStatusProgressBox
              orderStatus={order?.order_status as OrderStatus}
              paymentStatus={order?.payment_status as PaymentStatus}
            />
          </div>
        )}
      </Section>

      <Section
        title={t('table:table-item-products')}
        description={t('common:order-items-subtitle')}
        className="mb-0"
        contentClassName="px-0 pb-0 pt-0 sm:px-0"
      >
        <div className="overflow-x-auto">
          {order ? (
            <Table
              //@ts-ignore
              columns={columns}
              emptyText={() => (
                <div className="flex flex-col items-center py-7">
                  <NoDataFound className="w-52" />
                  <div className="mb-1 pt-6 text-base font-semibold text-heading">
                    {t('table:empty-table-data')}
                  </div>
                  <p className="text-[13px]">
                    {t('table:empty-table-sorry-text')}
                  </p>
                </div>
              )}
              //@ts-ignore
              data={order?.products!}
              rowKey="id"
              scroll={{ x: 300 }}
            />
          ) : (
            <span className="px-6">{t('common:no-order-found')}</span>
          )}
        </div>

        <div className="flex w-full flex-col space-y-2 border-t border-border/60 px-5 py-4 ms-auto sm:w-1/2 md:w-1/3 md:px-8">
          <div className="flex items-center justify-between text-sm text-body">
            <span>{t('common:order-sub-total')}</span>
            <span>{subtotal}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-body">
            <span>{t('common:order-tax')}</span>
            <span>{sales_tax}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-body">
            <span>{t('common:order-delivery-fee')}</span>
            <span>{delivery_fee}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-body">
            <span>{t('common:order-discount')}</span>
            <span>{discount}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-heading">
            <span>{t('common:order-total')}</span>
            <span>{total}</span>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Section title={t('common:billing-address')} className="mb-0">
          <div className="flex flex-col items-start space-y-1 text-sm text-body">
            <span>{order?.customer?.name}</span>
            {order?.billing_address && (
              <span>{formatAddress(order.billing_address)}</span>
            )}
            {order?.customer_contact && <span>{phoneNumber}</span>}
          </div>
        </Section>

        <Section title={t('common:shipping-address')} className="mb-0">
          <div className="flex flex-col items-start space-y-1 text-sm text-body">
            <span>{order?.customer?.name}</span>
            {order?.shipping_address && (
              <span>{formatAddress(order.shipping_address)}</span>
            )}
            {order?.customer_contact && <span>{phoneNumber}</span>}
          </div>
        </Section>
      </div>
    </div>
  );
}
OrderDetailsPage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
OrderDetailsPage.Layout = ShopLayout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common', 'form', 'table'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh","orderId":"__gh"} }], fallback: false };
}
