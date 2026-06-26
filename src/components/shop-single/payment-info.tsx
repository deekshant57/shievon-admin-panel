import { PaymentInfo } from '@/types';
import { useTranslation } from 'next-i18next';
import { ContentListVertical } from '@/components/shop-single/content-list';

type PaymentInfoProps = {
  payment: PaymentInfo;
};

const PaymentInfoList: React.FC<PaymentInfoProps> = ({ payment }) => {
  const { t } = useTranslation();

  if (!payment?.name && !payment?.email && !payment?.bank && !payment?.account) {
    return null;
  }

  return (
    <div className="space-y-4">
      <ContentListVertical
        title={t('common:text-name')}
        content={payment?.name as string}
      />
      <ContentListVertical
        title={t('common:text-email')}
        content={payment?.email as string}
      />
      <ContentListVertical
        title={t('common:text-bank')}
        content={payment?.bank as string}
      />
      <ContentListVertical
        title={t('common:text-account-no')}
        content={payment?.account.toLocaleString() as string}
      />
    </div>
  );
};

export default PaymentInfoList;
