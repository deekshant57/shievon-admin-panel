import { adminOnly } from '@/utils/auth-utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Loader from '@/components/ui/loader/loader';
import ErrorMessage from '@/components/ui/error-message';
import Button from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'next-i18next';
import AdminLayout from '@/components/layouts/admin';
import {
  useWithdrawQuery,
  useApproveWithdrawMutation,
  useDeleteWithdrawMutation,
} from '@/data/withdraw';
import Card from '@/components/common/card';
import TextArea from '@/components/ui/text-area';
import { useState } from 'react';

type FormValues = {
  note: string;
};

const normalizeStatus = (status?: string) =>
  String(status ?? '')
    .toUpperCase()
    .replace(/\s+/g, '_');

const Withdraw = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const {
    query: { withdrawId },
  } = router;

  const {
    withdraw,
    error,
    isLoading: loading,
  } = useWithdrawQuery({ id: withdrawId as string });

  const {
    handleSubmit,
    register,
  } = useForm<FormValues>({
    defaultValues: { note: '' },
  });
  const { mutate: approveWithdraw, isLoading: approving } =
    useApproveWithdrawMutation();
  const { mutate: deleteWithdraw, isLoading: cancelling } =
    useDeleteWithdrawMutation();

  const status = normalizeStatus(
    (withdraw?.status_key as string) || (withdraw?.status as string),
  );
  const isPending = status === 'PENDING' || status === '';

  function handleMarkPaid({ note }: FormValues) {
    approveWithdraw({
      id: withdrawId as string,
      note: note?.trim() || undefined,
    });
  }

  function handleCancelPayout() {
    if (!withdrawId) return;
    deleteWithdraw(
      { id: withdrawId as string },
      {
        onSuccess: () => {
          router.push('/withdraws');
        },
      },
    );
  }

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  const displayStatus =
    withdraw?.status_key ||
    status ||
    t('common:text-pending');

  const etaMessage =
    withdraw?.settlement_eta_message ||
    t('common:text-settlement-eta') ||
    'Bank transfer may take up to 5 working days.';

  return (
    <>
      <h3 className="mb-6 w-full text-xl font-semibold text-heading">
        {t('common:text-withdrawal-info')}
      </h3>
      <Card className="flex flex-col">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="w-full md:w-1/2">
            <div className="mb-2 flex items-center justify-start">
              <div className="flex w-4/12 flex-shrink-0 justify-between text-sm text-body me-5">
                <span>{t('common:text-amount')}</span>
                <span>:</span>
              </div>
              <div className="flex w-full items-center rounded border border-gray-300 px-4 py-3 xl:w-5/12">
                <span className="font-semibold text-heading">
                  {withdraw?.amount}
                </span>
              </div>
            </div>

            <div className="mb-2 flex items-center">
              <div className="flex w-4/12 flex-shrink-0 justify-between text-sm text-body me-5">
                <span>{t('common:text-status')}</span>
                <span>:</span>
              </div>
              <span className="w-full text-sm font-semibold text-heading">
                {displayStatus}
              </span>
            </div>

            {withdraw?.balance_kind ? (
              <div className="mb-2 flex items-center">
                <div className="flex w-4/12 flex-shrink-0 justify-between text-sm text-body me-5">
                  <span>{t('common:text-balance-kind') || 'Balance kind'}</span>
                  <span>:</span>
                </div>
                <span className="w-full text-sm font-semibold text-heading capitalize">
                  {withdraw.balance_kind}
                </span>
              </div>
            ) : null}

            <p className="mt-4 text-xs text-muted-foreground">{etaMessage}</p>
          </div>

          {isPending ? (
            <form
              onSubmit={handleSubmit(handleMarkPaid)}
              className="flex w-full flex-col gap-4 md:w-1/2"
            >
              <TextArea
                label={
                  t('form:input-label-utr-note') ||
                  'UTR / transfer reference (optional)'
                }
                {...register('note')}
                variant="outline"
              />
              <div className="flex flex-wrap gap-3">
                <Button loading={approving} disabled={approving || cancelling}>
                  {t('form:button-label-mark-paid') || 'Mark paid'}
                </Button>
                {!confirmCancel ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={approving || cancelling}
                    onClick={() => setConfirmCancel(true)}
                  >
                    {t('form:button-label-cancel-payout') || 'Cancel payout'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    loading={cancelling}
                    disabled={approving || cancelling}
                    onClick={handleCancelPayout}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {t('form:button-label-confirm-cancel-payout') ||
                      'Confirm cancel'}
                  </Button>
                )}
              </div>
            </form>
          ) : null}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        {withdraw?.details && (
          <Card className="flex flex-col">
            <div className="mb-2 text-sm font-semibold text-heading">
              <span>{t('common:text-details')} :</span>
            </div>
            <span className="text-sm text-body">{withdraw?.details}</span>
          </Card>
        )}

        {withdraw?.note && (
          <Card className="flex flex-col">
            <div className="mb-2 text-sm font-semibold text-heading">
              <span>{t('common:text-note')} :</span>
            </div>
            <span className="text-sm text-body">{withdraw?.note}</span>
          </Card>
        )}
      </div>
    </>
  );
};

export default Withdraw;

Withdraw.authenticate = {
  permissions: adminOnly,
};
Withdraw.Layout = AdminLayout;

export const getStaticProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"withdrawId":"__gh"} }], fallback: false };
}
