import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { Config } from '@/config';
import {
  installOrderAudioUnlock,
  isOrderAlertRinging,
  isOrderAlertSoundUnlocked,
  isOrderSoundMuted,
  setOrderSoundMuted,
  stopOrderAlertLoop,
  subscribeOrderAudio,
} from '@/utils/play-new-order-alert-sound';
import {
  OrderAlert,
  addOrderAlert,
  dismissAllOrderAlerts,
  dismissOrderAlert,
  getOrderAlerts,
  subscribeOrderAlerts,
  viewOrderAlert,
} from './order-alert-store';

const NO_ALERTS: OrderAlert[] = [];

/** Realtime order alerts only exist when Pusher is switched on for this build. */
export function isOrderRealtimeEnabled(): boolean {
  return Config.broadcastDriver === 'pusher' && Config.pusherEnable === 'true';
}

function audioSnapshot(): string {
  return [
    isOrderAlertSoundUnlocked() ? 'u' : 'l',
    isOrderSoundMuted() ? 'm' : 's',
    isOrderAlertRinging() ? 'r' : 'q',
  ].join('');
}

/**
 * Everything the UI needs for new-order alerts: the alerts on screen, the audio
 * state (unlocked / muted / ringing) and the actions. While the page is open it
 * also unlocks audio on the first click or keypress.
 */
export function useOrderAlerts() {
  const alerts = useSyncExternalStore(
    subscribeOrderAlerts,
    getOrderAlerts,
    () => NO_ALERTS,
  );
  const audio = useSyncExternalStore(
    subscribeOrderAudio,
    audioSnapshot,
    () => 'lsq',
  );

  useEffect(() => {
    if (!isOrderRealtimeEnabled()) {
      return;
    }
    return installOrderAudioUnlock();
  }, []);

  const setMuted = useCallback(
    (muted: boolean) => setOrderSoundMuted(muted),
    [],
  );

  return {
    alerts,
    unlocked: audio[0] === 'u',
    muted: audio[1] === 'm',
    ringing: audio[2] === 'r',
    setMuted,
    stopRinging: stopOrderAlertLoop,
    dismiss: dismissOrderAlert,
    dismissAll: dismissAllOrderAlerts,
    view: viewOrderAlert,
  };
}

export { addOrderAlert };
