import {
  isOrderAlertSoundUnlocked,
  isOrderSoundMuted,
  startOrderAlertLoop,
  stopOrderAlertLoop,
  subscribeOrderAudio,
} from '@/utils/play-new-order-alert-sound';
import { showSystemOrderNotification } from './order-alert-notification';

/**
 * Small framework-free store behind the new-order alert: what is on screen,
 * what rings, and what shows in a background tab. Components read it through
 * `useOrderAlerts`; Pusher handlers call `addOrderAlert`.
 */

export interface OrderAlert {
  /** Dedupe key: the notification id when there is one, else the order id. */
  id: string;
  orderId: string;
  orderNumber: string;
  /** e.g. "INR 499.00"; empty when the event did not carry an amount. */
  amountLabel: string;
  message: string;
  /** Where "View order" goes. */
  href: string;
  receivedAt: number;
}

/** An alert still waiting when audio gets unlocked rings only if it is this fresh. */
const RING_ON_LATE_UNLOCK_MS = 60_000;
const MAX_REMEMBERED_IDS = 200;

let alerts: OrderAlert[] = [];
const seen = new Set<string>();
const listeners = new Set<() => void>();
let navigate: ((href: string) => void) | null = null;
let hostClaim: string | null = null;
let audioWatch: (() => void) | null = null;
let wasUnlocked = false;

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeOrderAlerts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getOrderAlerts(): OrderAlert[] {
  return alerts;
}

/** Router-aware navigation, registered by the host so alerts open orders without a full reload. */
export function setOrderAlertNavigator(
  fn: ((href: string) => void) | null,
): void {
  navigate = fn;
}

/** Only one host component renders the alert cards, even if the bell is mounted twice. */
export function claimOrderAlertHost(id: string): boolean {
  if (hostClaim === null || hostClaim === id) {
    hostClaim = id;
    return true;
  }
  return false;
}

export function releaseOrderAlertHost(id: string): void {
  if (hostClaim === id) {
    hostClaim = null;
  }
}

function open(alert: OrderAlert): void {
  if (navigate) {
    navigate(alert.href);
  } else if (typeof window !== 'undefined') {
    window.location.assign(alert.href);
  }
}

/** If a click unlocks audio while an order alert is still on screen, ring then. */
function watchForLateUnlock(): void {
  if (audioWatch || typeof window === 'undefined') {
    return;
  }
  wasUnlocked = isOrderAlertSoundUnlocked();
  audioWatch = subscribeOrderAudio(() => {
    const unlocked = isOrderAlertSoundUnlocked();
    if (unlocked && !wasUnlocked) {
      const fresh = alerts.some(
        (alert) => Date.now() - alert.receivedAt < RING_ON_LATE_UNLOCK_MS,
      );
      if (fresh && !isOrderSoundMuted()) {
        void startOrderAlertLoop();
      }
    }
    wasUnlocked = unlocked;
  });
}

/**
 * A new paid order arrived. Shows the on-screen alert, rings (up to ~10s, one
 * shared loop however many arrive), and, if the tab is hidden, raises a system
 * notification that stays until clicked.
 */
export function addOrderAlert(input: Omit<OrderAlert, 'receivedAt'>): void {
  if (seen.has(input.id)) {
    return;
  }
  seen.add(input.id);
  if (seen.size > MAX_REMEMBERED_IDS) {
    seen.delete(seen.values().next().value as string);
  }

  const alert: OrderAlert = { ...input, receivedAt: Date.now() };
  alerts = [...alerts, alert];
  watchForLateUnlock();
  emit();

  void startOrderAlertLoop();

  if (typeof document !== 'undefined' && document.hidden) {
    showSystemOrderNotification({
      orderNumber: alert.orderNumber,
      body: alert.amountLabel
        ? `${alert.amountLabel}. ${alert.message}`
        : alert.message,
      onClick: () => {
        dismissOrderAlert(alert.id);
        open(alert);
      },
    });
  }
}

/** Dismiss one alert. Any acknowledgement silences the ringing. */
export function dismissOrderAlert(id: string): void {
  stopOrderAlertLoop();
  const next = alerts.filter((alert) => alert.id !== id);
  if (next.length !== alerts.length) {
    alerts = next;
    emit();
  }
}

/** "View order": acknowledge (silence + remove) and open the order. */
export function viewOrderAlert(id: string): void {
  const alert = alerts.find((candidate) => candidate.id === id);
  dismissOrderAlert(id);
  if (alert) {
    open(alert);
  }
}
