import { PaymentInfo } from '@/types';
import { useTranslation } from 'next-i18next';
import { ContentListVertical } from '@/components/shop-single/content-list';
import EmptyState from '@/components/page/empty-state';
import { Wallet } from 'lucide-react';

type PaymentInfoProps = {
  payment?: PaymentInfo;
};

const PaymentInfoList: React.FC<PaymentInfoProps> = ({ payment }) => {
  const { t } = useTranslation('common');

  if (!payment?.name && !payment?.email && !payment?.bank && !payment?.account) {
    return (
      <EmptyState
        icon={<Wallet className="h-10 w-10" />}
        title={t('text-no-payment-info')}
        description={t('text-no-payment-info-description')}
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-4">
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
        content={payment?.account?.toLocaleString() as string}
      />
    </div>
  );
};

export default PaymentInfoList;
