import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import {
  claimOrderAlertHost,
  releaseOrderAlertHost,
  setOrderAlertNavigator,
} from '@/utils/order-alert/order-alert-store';
import {
  dismissNotificationPrompt,
  requestNotificationPermission,
  shouldOfferNotificationPrompt,
} from '@/utils/order-alert/order-alert-notification';
import {
  isOrderRealtimeEnabled,
  useOrderAlerts,
} from '@/utils/order-alert/use-order-alerts';

const MAX_VISIBLE = 3;

/**
 * On-screen new-order alerts: one card per order (newest last), each with
 * "View order" and "Dismiss"; either one silences the ringing. Also offers,
 * once and only after the vendor clicks, to enable desktop notifications for
 * when this tab is in the background.
 */
const OrderAlertHost = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const hostId = useId();
  const { alerts, view, dismiss } = useOrderAlerts();
  const [isHost, setIsHost] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [offerNotify, setOfferNotify] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsHost(claimOrderAlertHost(hostId));
    return () => releaseOrderAlertHost(hostId);
  }, [hostId]);

  useEffect(() => {
    if (!isHost) return;
    setOrderAlertNavigator((href) => {
      void router.push(href);
    });
    return () => setOrderAlertNavigator(null);
  }, [isHost, router]);

  // Explain and ask for notification permission on the first alert, never on page load.
  useEffect(() => {
    if (alerts.length > 0 && shouldOfferNotificationPrompt()) {
      setOfferNotify(true);
    }
  }, [alerts.length]);

  if (!mounted || !isHost || !isOrderRealtimeEnabled()) {
    return null;
  }
  if (alerts.length === 0 && !offerNotify) {
    return null;
  }

  const visible = alerts.slice(-MAX_VISIBLE);
  const hidden = alerts.length - visible.length;

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-20 z-[9999] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-3">
      {hidden > 0 ? (
        <p className="pointer-events-auto rounded bg-gray-800 px-3 py-1.5 text-center text-xs font-medium text-white">
          {t('text-order-alert-more', { count: hidden })}
        </p>
      ) : null}

      {visible.map((alert) => (
        <div
          key={alert.id}
          role="alertdialog"
          aria-live="assertive"
          aria-label={t('text-order-alert-title')}
          className="pointer-events-auto rounded-lg border-2 border-accent bg-white p-4 shadow-2xl"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {t('text-order-alert-title')}
          </p>
          <p className="mt-1 text-lg font-bold text-heading">
            #{alert.orderNumber}
          </p>
          {alert.amountLabel ? (
            <p className="text-base font-semibold text-heading">
              {alert.amountLabel}
            </p>
          ) : null}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => view(alert.id)}
              className="flex-1 rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              {t('text-order-alert-view')}
            </button>
            <button
              type="button"
              onClick={() => dismiss(alert.id)}
              className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              {t('text-order-alert-dismiss')}
            </button>
          </div>
        </div>
      ))}

      {offerNotify ? (
        <div className="pointer-events-auto rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-xl">
          <p className="font-semibold text-heading">
            {t('text-order-notify-title')}
          </p>
          <p className="mt-1 text-body">{t('text-order-notify-body')}</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setOfferNotify(false);
                void requestNotificationPermission();
              }}
              className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              {t('text-order-notify-enable')}
            </button>
            <button
              type="button"
              onClick={() => {
                setOfferNotify(false);
                dismissNotificationPrompt();
              }}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-heading hover:bg-gray-50"
            >
              {t('text-order-notify-later')}
            </button>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
};

export default OrderAlertHost;
