/**
 * New paid-order alert sound.
 *
 * Browsers unlock audio only on the exact element(s) played during a user gesture.
 * We keep a small pool on `window` so Fast Refresh/HMR does not replace the unlocked
 * element, and prime every pool member when the vendor clicks the order bag.
 */

const STORAGE_KEY = 'vendor-order-sound-unlocked';
const ALERT_SRC = '/sounds/new-order-alert.wav';
const POOL_SIZE = 3;
const WINDOW_POOL_KEY = '__vendorOrderAlertAudioPool';

let poolCursor = 0;

type WindowWithAudioPool = Window & {
  [WINDOW_POOL_KEY]?: HTMLAudioElement[];
};

function getAudioPool(): HTMLAudioElement[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const win = window as WindowWithAudioPool;
  if (!win[WINDOW_POOL_KEY]) {
    win[WINDOW_POOL_KEY] = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(ALERT_SRC);
      audio.preload = 'auto';
      return audio;
    });
  }
  return win[WINDOW_POOL_KEY];
}

function markUnlocked(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // ignore private mode
  }
}

function clearUnlocked(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isOrderAlertSoundUnlocked(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

async function primeAudioElement(
  audio: HTMLAudioElement,
  volume: number,
): Promise<boolean> {
  audio.volume = volume;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // ignore
  }

  try {
    await audio.play();
    return true;
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.warn('[vendor-order-sound] play blocked', error);
    return false;
  }
}

function nextPoolAudio(): HTMLAudioElement | null {
  const pool = getAudioPool();
  if (!pool.length) {
    return null;
  }
  const audio = pool[poolCursor % pool.length];
  poolCursor += 1;
  return audio;
}

/**
 * Call from a user gesture (pointerdown on the order bag).
 * Primes every pool member so later Pusher replays can use any of them.
 */
export async function enableOrderAlertSound(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  const pool = getAudioPool();
  if (!pool.length) {
    return false;
  }

  // Quiet-prime all pool slots in this gesture (same user activation).
  for (const audio of pool) {
    const ok = await primeAudioElement(audio, 0.001);
    if (!ok) {
      clearUnlocked();
      return false;
    }
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // ignore
    }
  }

  // Audible confirmation on the first slot.
  const ok = await primeAudioElement(pool[0], 0.9);
  if (ok) {
    markUnlocked();
    return true;
  }

  clearUnlocked();
  return false;
}

/** Replay an unlocked pool slot when a live Pusher order notification arrives. */
export function playNewOrderAlertSound(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!isOrderAlertSoundUnlocked()) {
    // eslint-disable-next-line no-console
    console.info(
      '[vendor-order-sound] not enabled — click the order bag icon once',
    );
    return;
  }

  const audio = nextPoolAudio();
  if (!audio) {
    return;
  }

  void primeAudioElement(audio, 0.9).then((ok) => {
    if (!ok) {
      clearUnlocked();
      // eslint-disable-next-line no-console
      console.info(
        '[vendor-order-sound] replay blocked — click the order bag icon again',
      );
    }
  });
}

/** @deprecated use enableOrderAlertSound */
export function unlockNewOrderAlertSound(): void {
  void enableOrderAlertSound();
}

/** @deprecated no-op */
export function bindNewOrderAlertSoundUnlock(): void {}

/** @deprecated use isOrderAlertSoundUnlocked */
export function isNewOrderAlertSoundUnlocked(): boolean {
  return isOrderAlertSoundUnlocked();
}
