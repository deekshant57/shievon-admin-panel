/**
 * Desktop (system) notifications for new orders while the tab is in the
 * background. Permission is only ever requested from a click on our own prompt,
 * once: whatever the answer, we never ask again.
 */

const ASKED_KEY = 'vendor-order-notify-asked';

export type NotificationSupport =
  | 'unsupported'
  | 'default'
  | 'granted'
  | 'denied';

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

function wasAsked(): boolean {
  try {
    return localStorage.getItem(ASKED_KEY) === '1';
  } catch {
    return false;
  }
}

function markAsked(): void {
  try {
    localStorage.setItem(ASKED_KEY, '1');
  } catch {
    // storage unavailable: worst case we offer again next visit
  }
}

/** Offer the explanation prompt only if permission is undecided and we never asked. */
export function shouldOfferNotificationPrompt(): boolean {
  return getNotificationSupport() === 'default' && !wasAsked();
}

/** Call from a click handler. Resolves with the final permission. */
export async function requestNotificationPermission(): Promise<NotificationSupport> {
  markAsked();
  if (getNotificationSupport() !== 'default') {
    return getNotificationSupport();
  }
  try {
    await Notification.requestPermission();
  } catch {
    // old Safari uses a callback form; treat as undecided
  }
  return getNotificationSupport();
}

/** "Not now": remember so we do not nag. */
export function dismissNotificationPrompt(): void {
  markAsked();
}

export interface SystemOrderNotificationInput {
  orderNumber: string;
  body: string;
  /** Called when the vendor clicks the notification (the tab has been focused). */
  onClick: () => void;
}

/**
 * Shows a system notification that stays until acted on. Returns false if it
 * could not be shown (no permission, unsupported, blocked), so the caller can
 * fall back to the on-screen alert alone.
 */
export function showSystemOrderNotification(
  input: SystemOrderNotificationInput,
): boolean {
  if (getNotificationSupport() !== 'granted') {
    return false;
  }
  try {
    const notification = new Notification(
      `New paid order #${input.orderNumber}`,
      {
        body: input.body,
        tag: `vendor-order-${input.orderNumber}`,
        requireInteraction: true,
        icon: '/favicon.ico',
      },
    );
    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // some browsers refuse; navigation below still works
      }
      input.onClick();
      notification.close();
    };
    return true;
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.warn('[vendor-order-alert] system notification failed', error);
    return false;
  }
}
