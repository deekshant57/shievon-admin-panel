import Image from 'next/image';
import Link from '@/components/ui/link';
import Badge from '@/components/ui/badge/badge';
import { Shop, UserAddress } from '@/types';
import { formatAddress } from '@/utils/format-address';
import { useFormatPhoneNumber } from '@/utils/format-phone-number';
import { MapPinIcon } from '@/components/icons/map-pin';
import { isNumber } from 'lodash';
import ShopAvatar from '@/components/shop/shop-avatar';
import { PhoneOutlineIcon } from '@/components/icons/phone';
import { useTranslation } from 'next-i18next';
import NotificationActionButton from '@/components/notify-logs/notification-action-button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/utils';

type ShopCardProps = {
  shop: Shop;
};

export const ListItem = ({ title, info }: { title: string; info: number }) => {
  return (
    <>
      {isNumber(info) ? (
        <p className="text-sm font-bold text-heading">{Number(info)}</p>
      ) : null}
      {title ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{title}</p>
      ) : null}
    </>
  );
};

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const { t } = useTranslation();

  const phoneNumber = useFormatPhoneNumber({
    customer_contact: shop?.settings?.contact as string,
  });

  const slug =
    shop?.slug && typeof shop.slug === 'string' ? shop.slug.trim() : '';
  const href = slug ? `/${slug}` : '/';
  const address = formatAddress(shop?.address as UserAddress);

  return (
    <Card className="group overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="block">
        <div className="relative h-24 overflow-hidden bg-muted/40">
          <Image
            alt={shop?.name as string}
            src={shop?.cover_image?.original ?? '/topographic.svg'}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className={cn(
              shop?.cover_image?.original
                ? 'object-cover transition-transform duration-300 group-hover:scale-[1.02]'
                : 'object-contain object-center p-4',
            )}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute right-3 top-3">
            <Badge
              textKey={
                shop?.is_active ? 'common:text-active' : 'common:text-inactive'
              }
              color={
                shop?.is_active
                  ? 'bg-emerald-500/10 !text-emerald-700'
                  : 'bg-status-failed/10 text-status-failed'
              }
            />
          </div>
        </div>

        <CardContent className="relative px-5 pb-0 pt-0">
          <div className="-mt-10 flex flex-wrap items-end gap-3">
            <ShopAvatar
              is_active={shop?.is_active}
              name={shop?.name}
              logo={shop?.logo}
              className="shadow-sm"
            />
            <div className="min-w-0 flex-1 pb-1">
              {shop?.name ? (
                <h3 className="truncate text-base font-semibold text-heading">
                  {shop?.name}
                </h3>
              ) : null}

              {address ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                  <p className="truncate">{address}</p>
                </div>
              ) : null}

              {phoneNumber ? (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <PhoneOutlineIcon className="h-3.5 w-3.5 shrink-0" />
                  <p className="truncate">{phoneNumber}</p>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-4 grid grid-cols-4 divide-x divide-border/60 border-t border-border/60 px-2 py-4 text-center">
          <div>
            <ListItem
              title={t('text-title-commission')}
              info={shop?.balance?.admin_commission_rate ?? 0}
            />
          </div>
          <div>
            <ListItem
              title={t('text-title-sale')}
              info={shop?.balance?.total_earnings as number}
            />
          </div>
          <div>
            <ListItem
              title={t('text-title-balance')}
              info={shop?.balance?.current_balance as number}
            />
          </div>
          <div>
            <ListItem
              title={t('text-title-withdraw')}
              info={shop?.balance?.withdrawn_amount as number}
            />
          </div>
        </CardFooter>
      </Link>

      {shop?.notification_action ? (
        <div
          className="border-t border-border/60 px-4 py-3 text-right"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <NotificationActionButton
            notificationAction={shop.notification_action}
            entityName={shop.name}
            className="max-w-[150px]"
          />
        </div>
      ) : null}
    </Card>
  );
};

export default ShopCard;
