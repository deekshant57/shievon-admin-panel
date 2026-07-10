import cn from 'classnames';
import {
  useMarkAllVendorNotificationsReadMutation,
  useMarkVendorNotificationReadMutation,
  useVendorNotificationsQuery,
} from '@/data/vendor-notifications';
import { ShoppingBagIcon } from '@/components/icons/sidebar/shopping-bag';
import { Menu, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from 'react-query';
import Link from '@/components/ui/link';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import { toast } from 'react-toastify';
import { Routes } from '@/config/routes';
import { useRouter } from 'next/router';
import { useShopQuery } from '@/data/shop';
import { VendorNotification } from '@/types';
import { Config } from '@/config';
import { PusherConfig } from '@/utils/pusher-config';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import {
  enableOrderAlertSound,
  isOrderAlertSoundUnlocked,
  playNewOrderAlertSound,
} from '@/utils/play-new-order-alert-sound';

type RecentOrderBarProps = {
  user: {
    id?: string;
    shops?: Array<{ id: string | number; slug: string }>;
  };
};

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

function resolveShopSlug(
  item: VendorNotification,
  userShops: RecentOrderBarProps['user']['shops'],
  activeShopSlug?: string,
) {
  if (activeShopSlug) {
    return activeShopSlug;
  }
  return userShops?.find(
    (shop) => String(shop.id) === String(item.shop_id),
  )?.slug;
}

const VendorNotificationItem = ({
  item,
  user,
  activeShopSlug,
}: {
  item: VendorNotification;
  user: RecentOrderBarProps['user'];
  activeShopSlug?: string;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { permissions } = getAuthCredentials();
  const isSuperAdmin = hasAccess(adminOnly, permissions);
  const { mutate: markRead } = useMarkVendorNotificationReadMutation();

  function handleClick() {
    markRead({ id: item.id });

    const shopSlug = resolveShopSlug(item, user?.shops, activeShopSlug);
    const orderPath = Routes.order.details(item.order_id);
    const redirectTo = isSuperAdmin
      ? orderPath
      : shopSlug
        ? `/${shopSlug}${orderPath}`
        : orderPath;

    router.push(redirectTo);
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex gap-2 rounded-md py-3.5 px-6 text-sm font-semibold transition duration-200 before:absolute before:top-5 before:h-2 before:w-2 before:rounded-full before:bg-accent before:opacity-0 before:content-[''] before:start-2 hover:text-accent group-hover:bg-gray-100/70",
        item.is_read === false ? 'before:opacity-100' : null,
      )}
    >
      <div className="overflow-hidden">
        <h3
          className={cn(
            'truncate text-sm font-medium',
            item.is_read ? 'text-[#666]' : '',
          )}
        >
          {item.title || t('common:text-new-paid-order')}:{' '}
          <span className="inline-block font-bold hover:text-accent">
            #{item.order_number}
          </span>{' '}
          {t('common:text-order-is-paid')}.
        </h3>
        {item.body ? (
          <p className="mt-1 truncate text-xs text-body">{item.body}</p>
        ) : null}
        <span className="mt-2 block text-xs font-medium text-[#666666]">
          {dayjs.utc(item.created_at).tz(dayjs.tz.guess()).fromNow()}
        </span>
      </div>
    </div>
  );
};

type VendorOrderPaidPusherPayload = {
  message?: string;
  title?: string;
  notification_id?: string;
  order_id?: string;
  order_number?: string;
  shop_id?: number;
};

const RecentOrderBar = ({ user }: RecentOrderBarProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissions } = getAuthCredentials();
  const isSuperAdmin = hasAccess(adminOnly, permissions);
  const activeShopSlug = router.query.shop as string | undefined;
  const { data: shopData } = useShopQuery(
    { slug: activeShopSlug! },
    { enabled: Boolean(activeShopSlug) },
  );
  const shopIdParam = shopData?.id ? String(shopData.id) : undefined;

  const { notifications } = useVendorNotificationsQuery({
    limit: 5,
    ...(shopIdParam ? { shop_id: shopIdParam } : {}),
  });
  const { mutate: markAllRead } = useMarkAllVendorNotificationsReadMutation();
  const toastedIdsRef = useRef<Set<string>>(new Set());

  const soundPromptShownRef = useRef(false);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.is_read),
    [notifications],
  );

  // One-time hint: browsers require a click before alert audio can play.
  useEffect(() => {
    if (
      soundPromptShownRef.current ||
      isOrderAlertSoundUnlocked() ||
      Config.broadcastDriver !== 'pusher' ||
      Config.pusherEnable !== 'true'
    ) {
      return;
    }
    soundPromptShownRef.current = true;
    toast.info(
      t('common:text-enable-order-alert-sound') ||
        'Click the order bag icon once to enable new-order alert sounds.',
      { autoClose: 8000, toastId: 'vendor-order-sound-hint' },
    );
  }, [t]);

  useEffect(() => {
    if (
      Config.broadcastDriver !== 'pusher' ||
      Config.pusherEnable !== 'true' ||
      !user?.id
    ) {
      return;
    }

    const channelPrefix =
      process.env.NEXT_PUBLIC_ORDER_CREATED_CHANNEL_PRIVATE ||
      'private-order.created';
    const eventName =
      process.env.NEXT_PUBLIC_ORDER_CREATED_EVENT || 'order.create.event';
    const channelName = `${channelPrefix}.${user.id}`;
    // Reconnect if MessageBar/StoreNotice previously tore the shared socket down.
    if (PusherConfig.connection.state === 'disconnected') {
      PusherConfig.connect();
    }

    const channel = PusherConfig.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      // eslint-disable-next-line no-console
      console.info('[vendor-order-pusher] subscribed', channelName);
    });

    channel.bind(eventName, (data: VendorOrderPaidPusherPayload) => {
      // Always attempt sound on live events (toast text is deduped below).
      playNewOrderAlertSound();

      const toastId =
        data?.notification_id != null
          ? `vendor-order-${data.notification_id}`
          : data?.order_id != null
            ? `vendor-order-${data.order_id}`
            : 'vendor-order-paid';

      if (!toastedIdsRef.current.has(String(toastId))) {
        toastedIdsRef.current.add(String(toastId));
        toast.success(
          data?.message || data?.title || t('common:text-new-paid-order'),
          { toastId },
        );
      }

      queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_NOTIFICATIONS);
      queryClient.invalidateQueries(
        API_ENDPOINTS.VENDOR_NOTIFICATIONS_UNREAD_COUNT,
      );
      // Refresh orders list / detail caches so the open orders page updates live.
      queryClient.invalidateQueries(API_ENDPOINTS.ORDERS);
      queryClient.invalidateQueries(API_ENDPOINTS.ANALYTICS);
    });

    channel.bind('pusher:subscription_error', (status: unknown) => {
      // eslint-disable-next-line no-console
      console.error(
        '[vendor-order-pusher] subscription_error on',
        channelName,
        status,
      );
    });

    return () => {
      channel.unbind(eventName);
      channel.unbind('pusher:subscription_succeeded');
      channel.unbind('pusher:subscription_error');
      PusherConfig.unsubscribe(channelName);
    };
  }, [queryClient, t, user?.id]);

  const ordersListHref = useMemo(() => {
    if (isSuperAdmin) {
      return Routes.order.list;
    }
    const shopSlug =
      activeShopSlug ||
      user?.shops?.find((shop) => Boolean(shop.slug))?.slug;
    return shopSlug
      ? `/${shopSlug}${Routes.order.list}`
      : Routes.order.list;
  }, [activeShopSlug, isSuperAdmin, user?.shops]);

  function handleMarkAllRead() {
    markAllRead({ shop_id: shopIdParam });
  }

  return (
    <Menu as="div" className="inline-block text-left sm:relative">
      <Menu.Button
        className={cn(
          'relative flex h-9 w-9 items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-50 text-gray-600 before:absolute before:top-0 before:right-0 before:h-2 before:w-2 before:rounded-full focus:outline-none data-[headlessui-state=open]:bg-white data-[headlessui-state=open]:text-accent',
          unreadNotifications.length > 0 ? 'before:bg-[#3080F8]' : '',
        )}
        onPointerDown={() => {
          const wasUnlocked = isOrderAlertSoundUnlocked();
          void enableOrderAlertSound().then((ok) => {
            if (ok && !wasUnlocked) {
              toast.success(
                t('common:text-order-alert-sound-enabled') ||
                  'Order alert sounds enabled.',
                { toastId: 'vendor-order-sound-enabled' },
              );
            }
          });
        }}
      >
        <ShoppingBagIcon className="h-5 w-5" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          as="div"
          className="absolute top-16 z-30 w-80 rounded-lg border border-gray-200 bg-white shadow-box end-2 origin-top-end focus:outline-none sm:top-12 sm:mt-0.5 sm:end-0 lg:top-14 lg:mt-0"
        >
          <Menu.Item>
            <>
              <div className="flex items-center justify-between rounded-tl-lg rounded-tr-lg border-b border-gray-200/80 px-6 py-4 font-medium">
                <span>{t('text-orders')}</span>
                {unreadNotifications.length > 0 ? (
                  <span
                    className="block cursor-pointer text-sm font-medium text-accent hover:text-heading"
                    onClick={handleMarkAllRead}
                  >
                    {t('text-mark-all-read')}
                  </span>
                ) : null}
              </div>
              <div>
                {notifications.length ? (
                  notifications.map((item) => (
                    <div
                      className="group cursor-pointer border-b border-dashed border-gray-200 last:border-b-0"
                      key={item.id}
                    >
                      <VendorNotificationItem
                        item={item}
                        user={user}
                        activeShopSlug={activeShopSlug}
                      />
                    </div>
                  ))
                ) : (
                  <p className="mb-2 pt-5 pb-4 text-center text-sm font-medium text-gray-500">
                    {t('no-order-found')}
                  </p>
                )}
              </div>
              <Link
                href={ordersListHref}
                className="block border-t border-gray-200/80 p-3 text-center text-sm font-medium text-accent hover:text-accent-hover"
              >
                {t('text-see-all-notification')}
              </Link>
            </>
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default RecentOrderBar;
