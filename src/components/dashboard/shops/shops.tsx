import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { useMeQuery } from '@/data/user';
import { useShopsQuery } from '@/data/shop';
import ShopCard from '@/components/shop/shop-card';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import NotFound from '@/components/ui/not-found';
import { isEmpty } from 'lodash';

const ShopList = () => {
  const { t } = useTranslation();
  const { data, isLoading: meLoading, error: meError } = useMeQuery();
  const {
    shops,
    loading: shopsLoading,
    error: shopsError,
  } = useShopsQuery({});
  const { permissions } = getAuthCredentials();
  let permission = hasAccess(adminOnly, permissions);

  if (meLoading || shopsLoading)
    return <Loader text={t('common:text-loading')} />;
  if (meError) return <ErrorMessage message={meError.message} />;
  if (shopsError) return <ErrorMessage message={shopsError.message} />;

  // Prefer shops coming from /me (data.shops) when available; otherwise fall back to /shops
  const myShops = !isEmpty(data?.shops) ? data?.shops : shops;
  return (
    <>
      {permission ? (
        <div className="mb-5 border-b border-dashed border-border-base pb-5 md:mb-8 md:pb-7 ">
          <h1 className="text-lg font-semibold text-heading">
            {t('common:sidebar-nav-item-my-shops')}
          </h1>
        </div>
      ) : (
        ''
      )}
      {!isEmpty(myShops) ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4">
          {myShops?.map((shop: any, idx: number) => (
            <ShopCard shop={shop} key={idx} />
          ))}
        </div>
      ) : (
        ''
      )}
      {!data?.managed_shop && !myShops?.length ? (
        <NotFound
          image="/no-shop-found.svg"
          text="text-no-shop-found"
          className="mx-auto w-7/12"
        />
      ) : null}
      {!!data?.managed_shop ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4">
          <ShopCard shop={data?.managed_shop} />
        </div>
      ) : null}
    </>
  );
};

export default ShopList;
