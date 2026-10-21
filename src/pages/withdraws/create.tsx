import Layout from '@/components/layouts/admin';
import CreateOrUpdateWithdrawForm from '@/components/withdraw/withdraw-form';
import PageHeader from '@/components/page/page-header';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import Label from '@/components/ui/label';
import Select from '@/components/ui/select/select';
import { useShopsQuery } from '@/data/shop';
import { coerceWithdrawShopId } from '@/data/client/withdraw';
import { Shop } from '@/types';
import { adminOnly } from '@/utils/auth-utils';
import { Routes } from '@/config/routes';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminCreatePayoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const preselectedSlug =
    typeof router.query.shop === 'string' ? router.query.shop : null;

  const { shops, loading, error } = useShopsQuery({
    is_active: true,
    limit: 200,
  });

  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (!preselectedSlug || !shops?.length || selectedShop) return;
    const match = shops.find((s) => s.slug === preselectedSlug);
    if (match) setSelectedShop(match);
  }, [preselectedSlug, shops, selectedShop]);

  const shopId = useMemo(
    () => coerceWithdrawShopId(selectedShop?.id),
    [selectedShop?.id],
  );

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form:form-title-create-withdraw') || 'Create payout'}
        subtitle={
          t('form:withdraw-admin-create-subtitle') ||
          'Choose a shop, then create a payout (min ₹500). Mark paid after you transfer funds outside the app.'
        }
      />

      <div className="max-w-md">
        <Label>{t('common:text-select-shop') || 'Select shop'}</Label>
        <Select
          options={shops}
          isLoading={loading}
          getOptionLabel={(option: Shop) => option.name ?? option.slug ?? ''}
          getOptionValue={(option: Shop) => String(option.id)}
          placeholder={
            t('common:text-select-shop-placeholder') || 'Search shops…'
          }
          value={selectedShop}
          onChange={(shopOption: Shop | null) => {
            setSelectedShop(shopOption ?? null);
          }}
        />
      </div>

      {selectedShop && shopId != null ? (
        <CreateOrUpdateWithdrawForm
          shopId={shopId}
          shopSlug={selectedShop.slug}
          successRedirect={Routes.withdraw.list}
        />
      ) : selectedShop && shopId == null ? (
        <ErrorMessage
          message={
            t('form:error-invalid-shop-id') ||
            'This shop has an invalid id for payouts. Contact support.'
          }
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('form:text-select-shop-for-payout') ||
            'Select a shop to see pending balance and create a payout.'}
        </p>
      )}
    </div>
  );
}

AdminCreatePayoutPage.authenticate = {
  permissions: adminOnly,
};
AdminCreatePayoutPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['form', 'common', 'table'])),
  },
});
