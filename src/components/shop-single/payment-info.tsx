import { PaymentInfo } from '@/types';
import { useTranslation } from 'next-i18next';
import { ContentListVertical } from '@/components/shop-single/content-list';
import EmptyState from '@/components/page/empty-state';
import { Wallet } from 'lucide-react';
import Badge from '@/components/ui/badge/badge';
import { resolveBankVerificationStatus } from '@/utils/bank-verification';

type PaymentInfoProps = {
  payment?: PaymentInfo;
};

const PaymentInfoList: React.FC<PaymentInfoProps> = ({ payment }) => {
  const { t } = useTranslation('common');

  if (
    !payment?.name &&
    !payment?.email &&
    !payment?.bank &&
    !payment?.account &&
    !payment?.ifsc
  ) {
    return (
      <EmptyState
        icon={<Wallet className="h-10 w-10" />}
        title={t('text-no-payment-info')}
        description={t('text-no-payment-info-description')}
        className="py-8"
      />
    );
  }

  const status = resolveBankVerificationStatus({
    shopPaymentInfo: payment,
  });
  const statusLabel =
    status === 'verified'
      ? t('text-bank-verified') || 'Verified'
      : status === 'pending'
        ? t('text-bank-pending') || 'Pending'
        : status === 'failed'
          ? t('text-bank-failed') || 'Failed'
          : t('text-bank-unverified') || 'Unverified';
  const statusColor =
    status === 'verified'
      ? 'bg-green-500 bg-opacity-10 text-green-600'
      : status === 'failed'
        ? 'bg-red-500 bg-opacity-10 text-red-500'
        : 'bg-yellow-500 bg-opacity-10 text-yellow-700';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {t('text-verification-status') || 'Verification'}
        </span>
        <Badge text={statusLabel} color={statusColor} />
      </div>
      <ContentListVertical
        title={t('text-name')}
        content={payment?.name as string}
      />
      <ContentListVertical
        title={t('text-email')}
        content={payment?.email as string}
      />
      <ContentListVertical
        title={t('text-bank')}
        content={payment?.bank as string}
      />
      <ContentListVertical
        title={t('text-account-no')}
        content={
          payment?.account != null ? String(payment.account) : undefined
        }
      />
      <ContentListVertical
        title={t('text-ifsc') || 'IFSC'}
        content={payment?.ifsc as string}
      />
    </div>
  );
};

export default PaymentInfoList;
