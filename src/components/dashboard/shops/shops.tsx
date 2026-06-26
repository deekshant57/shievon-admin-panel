import EmptyState from '@/components/page/empty-state';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { useMeQuery } from '@/data/user';
import { useShopsQuery } from '@/data/shop';
import ShopCard from '@/components/shop/shop-card';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import { isEmpty } from 'lodash';
import Image from 'next/image';

const ShopList = ({ hideTitle = false }: { hideTitle?: boolean }) => {
  const { t } = useTranslation();
  const { data, isLoading: meLoading, error: meError } = useMeQuery();
  const {
    shops,
    loading: shopsLoading,
    error: shopsError,
  } = useShopsQuery({});
  const { permissions } = getAuthCredentials();
  const permission = hasAccess(adminOnly, permissions);

  if (meLoading || shopsLoading) {
    return <Loader text={t('common:text-loading')} />;
  }
  if (meError) return <ErrorMessage message={meError.message} />;
  if (shopsError) return <ErrorMessage message={shopsError.message} />;

  const myShops = !isEmpty(data?.shops) ? data?.shops : shops;
  const hasManagedShop = !!data?.managed_shop;
  const hasShops = !isEmpty(myShops) || hasManagedShop;

  return (
    <>
      {permission && !hideTitle ? (
        <div className="mb-6 border-b border-border/60 pb-5 md:mb-8 md:pb-6">
          <h2 className="text-lg font-bold tracking-tight text-heading">
            {t('common:sidebar-nav-item-my-shops')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('dashboard-subtitle-my-shops') ||
              'Select a shop to open its dashboard'}
          </p>
        </div>
      ) : null}

      {hasShops ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4">
          {myShops?.map((shop: any, idx: number) => (
            <ShopCard shop={shop} key={shop?.id ?? idx} />
          ))}
          {hasManagedShop ? (
            <ShopCard shop={data!.managed_shop!} key={`managed-${data?.managed_shop?.id}`} />
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={
            <Image
              src="/no-shop-found.svg"
              alt=""
              width={200}
              height={160}
              className="opacity-80"
            />
          }
          title={t('common:text-no-shop-found') || 'No shop found'}
          description={
            t('dashboard-subtitle-my-shops') ||
            'Select a shop to open its dashboard'
          }
          className="py-16"
        />
      )}
    </>
  );
};

export default ShopList;
