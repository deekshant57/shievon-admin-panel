import cn from 'classnames';
import {
  useVendorNotificationReadMutation,
  useVendorNotificationsQuery,
  useVendorNotificationsReadAllMutation,
  vendorNotificationsPollInterval,
} from '@/data/vendor-notifications';
import { ShoppingBagIcon } from '@/components/icons/sidebar/shopping-bag';
import { Menu, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import Link from '@/components/ui/link';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import { PusherConfig } from '@/utils/pusher-config';
import { toast } from 'react-toastify';
import { Routes } from '@/config/routes';
import { useRouter } from 'next/router';
import { useShopQuery } from '@/data/shop';
import { useQueryClient } from 'react-query';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import { Config } from '@/config';
import type { VendorNotification } from '@/types';

type RecentOrderBarProps = {
  user: {
    id?: string;
    shops?: Array<{ id: string | number; slug: string }>;
  };
};

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

function isPusherRealtimeEnabled(): boolean {
  return Config.broadcastDriver === 'pusher' && Config.pusherEnable === 'true';
}

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
  const { mutate: markRead } = useVendorNotificationReadMutation();

  function handleClick() {
    if (!item.is_read) {
      markRead(item.id);
    }

    const shopSlug = resolveShopSlug(item, user?.shops, activeShopSlug);
    const orderPath = Routes.order.details(item.order_id || item.notify_tracker);
    const redirectTo = isSuperAdmin
      ? `/${orderPath}`
      : shopSlug
        ? `/${shopSlug}/${orderPath}`
        : `/${orderPath}`;

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
          {item.title || t('text-order')}:{' '}
          <span className="inline-block font-bold hover:text-accent">
            #{item.order_number || item.notify_tracker}
          </span>
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
  const pollInterval = vendorNotificationsPollInterval();

  const { notifications } = useVendorNotificationsQuery(
    {
      limit: 5,
      page: 1,
      ...(shopIdParam ? { shop_id: shopIdParam } : {}),
    },
    { refetchInterval: pollInterval },
  );
  const { mutate: markAllRead } = useVendorNotificationsReadAllMutation();
  const toastedIdsRef = useRef<Set<string>>(new Set());

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.is_read),
    [notifications],
  );

  // Fallback toast when polling discovers new unread items (Pusher disabled).
  useEffect(() => {
    if (isPusherRealtimeEnabled()) {
      return;
    }
    unreadNotifications.forEach((item) => {
      if (toastedIdsRef.current.has(item.id)) {
        return;
      }
      toastedIdsRef.current.add(item.id);
      toast.success(item.body || item.title || t('text-order'), {
        toastId: `vendor-order-${item.id}`,
      });
    });
  }, [unreadNotifications, t]);

  // Real-time: Pusher pushes paid-order events; refetch bell list immediately.
  useEffect(() => {
    if (!isPusherRealtimeEnabled() || !user?.id) {
      return;
    }

    const channelPrefix =
      process.env.NEXT_PUBLIC_ORDER_CREATED_CHANNEL_PRIVATE ||
      'private-order.created';
    const eventName =
      process.env.NEXT_PUBLIC_ORDER_CREATED_EVENT || 'order.create.event';
    const channelName = `${channelPrefix}.${user.id}`;
    const channel = PusherConfig.subscribe(channelName);

    channel.bind(
      eventName,
      (data: {
        message?: string;
        notification_id?: string;
        order_number?: string;
      }) => {
        void queryClient.invalidateQueries(API_ENDPOINTS.VENDOR_NOTIFICATIONS);
        void queryClient.invalidateQueries(
          API_ENDPOINTS.VENDOR_NOTIFICATIONS_UNREAD_COUNT,
        );
        toast.success(data?.message || t('text-order'), {
          toastId: data?.notification_id
            ? `vendor-order-${data.notification_id}`
            : `vendor-order-${data?.order_number ?? Date.now()}`,
        });
      },
    );

    return () => {
      channel.unbind(eventName);
      PusherConfig.unsubscribe(channelName);
    };
  }, [queryClient, t, user?.id]);

  const ordersListHref = useMemo(() => {
    if (isSuperAdmin) {
      return `/${Routes.order.list}`;
    }
    const shopSlug =
      activeShopSlug ||
      user?.shops?.find((shop) => Boolean(shop.slug))?.slug;
    return shopSlug ? `/${shopSlug}/${Routes.order.list}` : `/${Routes.order.list}`;
  }, [activeShopSlug, isSuperAdmin, user?.shops]);

  function handleMarkAllRead() {
    markAllRead(shopIdParam ? { shop_id: shopIdParam } : undefined);
  }

  return (
    <Menu as="div" className="inline-block text-left sm:relative">
      <Menu.Button
        className={cn(
          'relative flex h-9 w-9 items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-50 text-gray-600 before:absolute before:top-0 before:right-0 before:h-2 before:w-2 before:rounded-full focus:outline-none data-[headlessui-state=open]:bg-white data-[headlessui-state=open]:text-accent',
          unreadNotifications.length > 0 ? 'before:bg-[#3080F8]' : '',
        )}
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
