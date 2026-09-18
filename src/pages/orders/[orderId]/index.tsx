import { DownloadIcon } from '@/components/icons/download-icon';
import Layout from '@/components/layouts/admin';
import OrderStatusProgressBox from '@/components/order/order-status-progress-box';
import OrderViewHeader from '@/components/order/order-view-header';
import OrderFulfillmentSection from '@/components/order/order-fulfillment-section';
import PageHeader from '@/components/page/page-header';
import Section from '@/components/page/section';
import ActionButton from '@/components/ui/action-button';
import ErrorMessage from '@/components/ui/error-message';
import ValidationError from '@/components/ui/form-validation-error';
import Loader from '@/components/ui/loader/loader';
import SelectInput from '@/components/ui/select-input';
import { Table } from '@/components/ui/table';
import { clearCheckoutAtom } from '@/contexts/checkout';
import { useCart } from '@/contexts/quick-cart/cart.context';
import {
  useDownloadInvoiceMutation,
  useOrderQuery,
  useUpdateOrderMutation,
} from '@/data/order';
import { NoDataFound } from '@/components/icons/no-data-found';
import { siteSettings } from '@/settings/site.settings';
import { Attachment, OrderStatus, PaymentStatus } from '@/types';
import { formatAddress } from '@/utils/format-address';
import { formatString } from '@/utils/format-string';
import { useIsRTL } from '@/utils/locals';
import { ORDER_STATUS } from '@/utils/order-status';
import {
  getFulfillmentAdminStatusOptions,
  hasFulfillmentFlow,
} from '@/utils/order-fulfillment';
import usePrice from '@/utils/use-price';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useFormatPhoneNumber } from '@/utils/format-phone-number';

type FormValues = {
  order_status: any;
};
export default function OrderDetailsPage() {
  const { t } = useTranslation();
  const { query, locale } = useRouter();
  const { alignLeft, alignRight, isRTL } = useIsRTL();
  const { resetCart } = useCart();
  const [, resetCheckout] = useAtom(clearCheckoutAtom);

  useEffect(() => {
    resetCart();
    // @ts-ignore
    resetCheckout();
  }, [resetCart, resetCheckout]);

  const { mutate: updateOrder, isLoading: updating } = useUpdateOrderMutation();
  const {
    order,
    isLoading: loading,
    error,
    refetch: refetchOrder,
  } = useOrderQuery({ id: query.orderId as string, language: locale! });
  const { refetch } = useDownloadInvoiceMutation(
    {
      order_id: query.orderId as string,
      isRTL,
      language: locale!,
    },
    { enabled: false },
  );

  const {
    handleSubmit,
    control,

    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { order_status: order?.order_status ?? '' },
  });

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
      amount: order?.discount! ?? 0,
    },
  );
  const { price: sales_tax } = usePrice(
    order && {
      amount: order?.sales_tax!,
    },
  );
  const { price: sub_total } = usePrice({ amount: order?.amount! });
  const { price: shipping_charge } = usePrice({
    amount: order?.delivery_fee ?? 0,
  });
  const { price: wallet_total } = usePrice({
    amount: order?.wallet_point?.amount!,
  });

  const amountPayable: number =
    order?.payment_status !== PaymentStatus.SUCCESS
      ? order?.paid_total! - order?.wallet_point?.amount!
      : 0;

  const { price: amountDue } = usePrice({ amount: amountPayable });

  const phoneNumber = useFormatPhoneNumber({
    customer_contact: order?.customer_contact as string,
  });
  const showFulfillmentUi = hasFulfillmentFlow(order);
  const legacyStatusOptions = useMemo(() => {
    if (!showFulfillmentUi) {
      return ORDER_STATUS.slice(0, 6);
    }
    const allowed = getFulfillmentAdminStatusOptions();
    return ORDER_STATUS.filter((entry) => allowed.includes(entry.status));
  }, [showFulfillmentUi]);

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!order) return <ErrorMessage message={t('common:no-order-found')} />;

  async function handleDownloadInvoice() {
    const { data } = await refetch();

    if (data) {
      const a = document.createElement('a');
      a.href = data;
      a.setAttribute('download', 'order-invoice');
      a.click();
    }
  }

  const columns = [
    {
      dataIndex: 'image',
      key: 'image',
      width: 70,
      render: (image: Attachment) => (
        <div className="relative h-[50px] w-[50px]">
          <Image
            src={image?.thumbnail ?? siteSettings.product.placeholder}
            alt="alt text"
            fill
            sizes="(max-width: 768px) 100vw"
            className="object-fill"
          />
        </div>
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
      dataIndex: 'price',
      key: 'price',
      align: alignRight,
      render: function Render(_: any, item: any) {
        const { price } = usePrice({
          amount: parseFloat(item.pivot.subtotal),
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
        toolbarLayout="stacked"
      >
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
      </PageHeader>

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
            shop={order?.shop}
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
              data={order?.products!}
              rowKey="id"
              scroll={{ x: 300 }}
            />
          ) : (
            <span className="px-6">{t('common:no-order-found')}</span>
          )}
        </div>

        {order?.parent_id! ? (
          <div className="flex w-full flex-col space-y-2 border-t border-border/60 px-5 py-4 ms-auto sm:w-1/2 md:w-1/3 md:px-8">
            <div className="flex items-center justify-between text-sm text-body">
              <span>{t('common:order-sub-total')}</span>
              <span>{subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-heading">
              <span>{t('common:order-total')}</span>
              <span>{total}</span>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col space-y-2 border-t border-border/60 px-5 py-4 ms-auto sm:w-1/2 md:w-1/3 md:px-8">
            <div className="flex items-center justify-between text-sm text-body">
              <span>{t('common:order-sub-total')}</span>
              <span>{sub_total}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-body">
              <span>{t('text-shipping-charge')}</span>
              <span>{shipping_charge}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-body">
              <span>{t('text-tax')}</span>
              <span>{sales_tax}</span>
            </div>
            {order?.discount! > 0 && (
              <div className="flex items-center justify-between text-sm text-body">
                <span>{t('text-discount')}</span>
                <span>{discount}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-base font-semibold text-heading">
              <span>{t('text-total')}</span>
              <span>{total}</span>
            </div>

            {order?.wallet_point?.amount! ? (
              <>
                <div className="flex items-center justify-between text-sm text-body">
                  <span>{t('text-paid-from-wallet')}</span>
                  <span>{wallet_total}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-heading">
                  <span>{t('text-amount-due')}</span>
                  <span>{amountDue}</span>
                </div>
              </>
            ) : null}
          </div>
        )}
      </Section>

      {order?.note ? (
        <Section title={t('common:text-purchase-note') || 'Purchase Note'}>
          <p className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-body">
            {order?.note}
          </p>
        </Section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Section title={t('text-order-details')} className="mb-0">
          <div className="flex flex-col items-start space-y-1 text-sm text-body">
            <span>{formatString(order?.products?.length, t('text-item'))}</span>
            <span>{order?.delivery_time}</span>
            <span>
              {`${t('text-payment-method')}:  ${order?.payment_gateway}`}
            </span>
          </div>
        </Section>

        <Section title={t('common:billing-address')} className="mb-0">
          <div className="flex flex-col items-start space-y-1 text-sm text-body">
            <span>{order?.customer_name}</span>
            {order?.billing_address && (
              <span>{formatAddress(order.billing_address)}</span>
            )}
            {order?.customer_contact && <span>{phoneNumber}</span>}
          </div>
        </Section>

        <Section title={t('common:shipping-address')} className="mb-0">
          <div className="flex flex-col items-start space-y-1 text-sm text-body">
            <span>{order?.customer_name}</span>
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
OrderDetailsPage.Layout = Layout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'form', 'table'])),
  },
});
