import Input from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/button';
import TextArea from '@/components/ui/text-area';
import Card from '@/components/common/card';
import Description from '@/components/ui/description';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import { withdrawValidationSchema } from './withdraw-validation-schema';
import { useState } from 'react';
import Alert from '@/components/ui/alert';
import { animateScroll } from 'react-scroll';
import { Withdraw } from '@/types';
import { useShopQuery } from '@/data/shop';
import { useCreateWithdrawMutation } from '@/data/withdraw';
import { coerceWithdrawShopId } from '@/data/client/withdraw';
import { useVendorSettlementQuery } from '@/data/vendor-settlement';
import Label from '@/components/ui/label';
import usePrice from '@/utils/use-price';
import StickyFooterPanel from '@/components/ui/sticky-footer-panel';
import Link from '@/components/ui/link';
import { getApiErrorMessage } from '@/data/client/http-client';
import { Routes } from '@/config/routes';

type FormValues = {
  amount: number;
  note: string;
  balance_kind?: string;
};

type IProps = {
  initialValues?: Withdraw | null;
  /** Prefer explicit shop id from admin create flow */
  shopId?: string | number | null;
  /** Optional slug for payment-settings deep link */
  shopSlug?: string | null;
  /** Where to return after success (defaults to global payouts list) */
  successRedirect?: string;
};

const isBankReady = (payment?: {
  name?: string;
  bank?: string;
  account?: string | number;
  ifsc?: string;
}) =>
  Boolean(
    payment?.name?.toString().trim() &&
      payment?.bank?.toString().trim() &&
      payment?.account != null &&
      String(payment.account).trim() &&
      payment?.ifsc?.toString().trim(),
  );

function resolveNumericShopId(raw?: string | number | null): number | null {
  return coerceWithdrawShopId(raw);
}

export default function CreateOrUpdateWithdrawForm({
  initialValues,
  shopId: shopIdProp,
  shopSlug: shopSlugProp,
  successRedirect,
}: IProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    query: { shop: shopFromRoute },
  } = router;
  const { t } = useTranslation();

  const shopSlug =
    shopSlugProp ||
    (typeof shopFromRoute === 'string' ? shopFromRoute : null);

  const { data: shopData, isLoading: loadingShop } = useShopQuery(
    { slug: shopSlug as string },
    { enabled: Boolean(shopSlug) && shopIdProp == null },
  );

  const resolvedShopId =
    resolveNumericShopId(shopIdProp) ??
    resolveNumericShopId(shopData?.id ?? null);

  const { settlement, loading: loadingSettlement } = useVendorSettlementQuery(
    resolvedShopId,
    {
      enabled: Boolean(resolvedShopId),
      retry: false,
    },
  );

  const availableBalance =
    settlement?.pending ?? shopData?.balance?.current_balance ?? 0;
  const { price: shopBalance } = usePrice({
    amount: availableBalance,
  });

  const paymentInfo =
    settlement?.payment_info ?? shopData?.balance?.payment_info;
  const bankIncomplete = !isBankReady(paymentInfo);
  const paymentSettingsHref = shopSlug
    ? `/${shopSlug}/edit`
    : Routes.adminMyShops;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    //@ts-ignore
    defaultValues: {
      amount: undefined,
      note: '',
      balance_kind: 'product',
      ...initialValues,
    },
    //@ts-ignore
    resolver: yupResolver(withdrawValidationSchema),
  });

  const { mutate: createWithdraw, isLoading: creating } =
    useCreateWithdrawMutation(successRedirect);

  const onSubmit = (values: FormValues) => {
    if (resolvedShopId == null) {
      setErrorMessage(
        t('form:error-shop-required-for-payout') ||
          'Select a shop before creating a payout.',
      );
      animateScroll.scrollToTop();
      // eslint-disable-next-line no-console
      console.warn('[payouts] create blocked — missing shop_id', {
        shopIdProp,
        shopSlug,
        shopDataId: shopData?.id,
      });
      return;
    }

    if (bankIncomplete) {
      setErrorMessage(
        t('form:error-bank-incomplete-for-payout') ||
          'Complete and verify bank details before creating a payout.',
      );
      animateScroll.scrollToTop();
      return;
    }

    const payload = {
      amount: +values.amount,
      shop_id: resolvedShopId,
      note: values.note,
      balance_kind:
        (values.balance_kind as 'product' | 'service') || 'product',
    };

    // eslint-disable-next-line no-console
    console.info('[payouts] create payout request', payload);

    createWithdraw(payload, {
      onError: (error: unknown) => {
        setErrorMessage(getApiErrorMessage(error));
        animateScroll.scrollToTop();
      },
    });
  };

  const waitingForShop =
    Boolean(shopSlug) && shopIdProp == null && loadingShop;
  const canSubmit =
    resolvedShopId != null && !bankIncomplete && !waitingForShop;

  return (
    <>
      {errorMessage ? (
        <Alert
          message={errorMessage}
          variant="error"
          closeable={true}
          className="mt-5"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}
      {resolvedShopId == null && !waitingForShop ? (
        <Alert
          message={
            (t('form:error-shop-required-for-payout') as string) ||
            'Select a shop before creating a payout.'
          }
          variant="warning"
          className="mt-5"
        />
      ) : null}
      {bankIncomplete && resolvedShopId != null ? (
        <Alert
          message={
            (t('form:error-bank-incomplete-for-payout') as string) ||
            'Complete bank details (name, bank, account, IFSC) before creating a payout.'
          }
          variant="error"
          className="mt-5"
        >
          <Link
            href={paymentSettingsHref}
            className="mt-2 inline-block font-semibold text-accent underline"
          >
            {t('form:link-edit-payment-info') || 'Edit payment info'}
          </Link>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-wrap my-5 sm:my-8">
          <Description
            title={t('form:input-label-description')}
            details={`${
              initialValues
                ? t('form:item-description-edit')
                : t('form:item-description-add')
            } ${t('form:withdraw-description-helper-text')}`}
            className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5 "
          />

          <Card className="w-full sm:w-8/12 md:w-2/3">
            {shopData?.name || shopSlug ? (
              <p className="mb-5 text-sm text-body">
                {t('common:text-shop') || 'Shop'}:{' '}
                <span className="font-semibold text-heading">
                  {shopData?.name || shopSlug}
                </span>
              </p>
            ) : null}
            <Label>
              {t('form:input-label-amount')}
              <span className="ml-0.5 text-red-500">*</span>
              <span className="text-xs text-body">
                ({t('common:text-available-balance')}:
                <span className="font-bold text-accent">
                  {loadingSettlement ? '…' : shopBalance}
                </span>
                )
              </span>
            </Label>
            <Input
              {...register('amount')}
              error={t(errors.amount?.message!)}
              variant="outline"
              className="mb-5"
              type="number"
              min={500}
              step="0.01"
            />
            <p className="mb-5 -mt-3 text-xs text-muted-foreground">
              {t('form:text-min-payout-amount') ||
                'Minimum payout amount is ₹500.'}
            </p>

            <TextArea
              label={t('form:input-label-note')}
              {...register('note')}
              variant="outline"
              className="mb-5"
            />
          </Card>
        </div>
        <StickyFooterPanel className="z-0">
          <div className="text-end">
            <Button
              variant="outline"
              onClick={router.back}
              className="text-sm me-4 md:text-base"
              type="button"
            >
              {t('form:button-label-back')}
            </Button>

            <Button
              loading={creating || waitingForShop}
              disabled={creating || !canSubmit}
              className="text-sm md:text-base"
            >
              {initialValues
                ? t('form:button-label-update-withdraw')
                : t('form:button-label-add-withdraw')}
            </Button>
          </div>
        </StickyFooterPanel>
      </form>
    </>
  );
}
