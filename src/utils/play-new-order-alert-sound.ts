/**
 * New paid-order alert sound.
 *
 * Browsers unlock audio only after a user gesture. We keep a small pool of
 * elements on `window` (so Fast Refresh/HMR does not replace an unlocked one)
 * and prime every one of them during a gesture, including a dedicated element
 * for the looping alarm. Safari unlocks per element, so priming them all matters.
 *
 * - `playNewOrderAlertSound()`: one-shot, unchanged for existing callers.
 * - `startOrderAlertLoop()` / `stopOrderAlertLoop()`: the ringing alert. One loop
 *   element, so several orders arriving together never stack overlapping loops.
 * - `installOrderAudioUnlock()`: unlocks silently on the first click/keypress.
 * - Mute is per browser (localStorage).
 */

/** Per-document flag: a reload loses the browser's audio permission, so it must not outlive the page. */
const UNLOCKED_KEY = '__vendorOrderAudioUnlocked';
const MUTE_KEY = 'vendor-order-sound-muted';
const ALERT_SRC = '/sounds/new-order-alert.wav';
const POOL_SIZE = 3;
const WINDOW_POOL_KEY = '__vendorOrderAlertAudioPool';
const WINDOW_LOOP_KEY = '__vendorOrderAlertLoopAudio';

/** The ringing alert stops by itself after this long if nobody acknowledges it. */
export const ORDER_ALERT_LOOP_MS = 10_000;

let poolCursor = 0;
let loopTimer: ReturnType<typeof setTimeout> | null = null;
let looping = false;
let unlockInstalled = false;

type WindowWithAudio = Window & {
  [WINDOW_POOL_KEY]?: HTMLAudioElement[];
  [WINDOW_LOOP_KEY]?: HTMLAudioElement;
  [UNLOCKED_KEY]?: boolean;
};

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // a broken subscriber must not stop the others
    }
  });
}

/** Subscribe to unlocked / muted / ringing changes (for useSyncExternalStore). */
export function subscribeOrderAudio(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getAudioPool(): HTMLAudioElement[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const win = window as WindowWithAudio;
  if (!win[WINDOW_POOL_KEY]) {
    win[WINDOW_POOL_KEY] = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(ALERT_SRC);
      audio.preload = 'auto';
      return audio;
    });
  }
  return win[WINDOW_POOL_KEY];
}

function getLoopAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const win = window as WindowWithAudio;
  if (!win[WINDOW_LOOP_KEY]) {
    const audio = new Audio(ALERT_SRC);
    audio.preload = 'auto';
    win[WINDOW_LOOP_KEY] = audio;
  }
  return win[WINDOW_LOOP_KEY] ?? null;
}

function markUnlocked(): void {
  if (typeof window !== 'undefined') {
    (window as WindowWithAudio)[UNLOCKED_KEY] = true;
  }
  emit();
}

function clearUnlocked(): void {
  if (typeof window !== 'undefined') {
    (window as WindowWithAudio)[UNLOCKED_KEY] = false;
  }
  emit();
}

export function isOrderAlertSoundUnlocked(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (window as WindowWithAudio)[UNLOCKED_KEY] === true;
}

/** True when the vendor has muted order sounds in this browser. */
export function isOrderSoundMuted(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOrderSoundMuted(muted: boolean): void {
  try {
    if (muted) {
      localStorage.setItem(MUTE_KEY, '1');
    } else {
      localStorage.removeItem(MUTE_KEY);
    }
  } catch {
    // storage unavailable: the choice just won't persist
  }
  if (muted) {
    stopOrderAlertLoop();
  }
  emit();
}

export function isOrderAlertRinging(): boolean {
  return looping;
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

function silence(audio: HTMLAudioElement): void {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // ignore
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
 * Primes every element quietly during a user gesture. Returns whether audio is
 * now unlocked; on false the caller keeps showing the "enable sounds" prompt.
 */
export async function unlockOrderAlertSoundSilently(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }
  const loop = getLoopAudio();
  const all = [...getAudioPool(), ...(loop ? [loop] : [])];
  if (!all.length) {
    return false;
  }
  for (const audio of all) {
    if (!(await primeAudioElement(audio, 0.001))) {
      clearUnlocked();
      return false;
    }
    silence(audio);
  }
  markUnlocked();
  return true;
}

/**
 * Call from a user gesture. Unlocks, then plays an audible confirmation.
 * Kept for the bell button and any existing callers.
 */
export async function enableOrderAlertSound(): Promise<boolean> {
  if (!(await unlockOrderAlertSoundSilently())) {
    return false;
  }
  const pool = getAudioPool();
  const ok = await primeAudioElement(pool[0], 0.9);
  if (!ok) {
    clearUnlocked();
  }
  return ok;
}

/**
 * Unlocks audio on the first click or keypress anywhere in the panel. Safe to
 * call repeatedly. If a gesture is still not enough (blocked), the listeners stay
 * so the next gesture tries again; callers should show the persistent prompt
 * while `isOrderAlertSoundUnlocked()` is false.
 */
export function installOrderAudioUnlock(): () => void {
  if (typeof document === 'undefined' || unlockInstalled) {
    return () => {};
  }
  unlockInstalled = true;

  const onGesture = () => {
    void unlockOrderAlertSoundSilently().then((ok) => {
      if (ok) {
        remove();
      }
    });
  };
  const remove = () => {
    document.removeEventListener('pointerdown', onGesture, true);
    document.removeEventListener('keydown', onGesture, true);
    unlockInstalled = false;
  };

  if (isOrderAlertSoundUnlocked()) {
    unlockInstalled = false;
    return () => {};
  }
  document.addEventListener('pointerdown', onGesture, true);
  document.addEventListener('keydown', onGesture, true);
  return remove;
}

/** Replay an unlocked pool slot when a live Pusher order notification arrives. */
export function playNewOrderAlertSound(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (isOrderSoundMuted()) {
    return;
  }

  if (!isOrderAlertSoundUnlocked()) {
    // eslint-disable-next-line no-console
    console.info('[vendor-order-sound] not enabled yet — waiting for a click');
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
        '[vendor-order-sound] replay blocked — click the panel once',
      );
    }
  });
}

/**
 * Rings the alert: loops the sound for up to `maxMs` or until
 * `stopOrderAlertLoop()`. If it is already ringing the same element keeps
 * playing and the stop deadline restarts, so orders arriving together share one
 * loop. Returns false if muted or the browser blocked playback (the unlock
 * prompt then stays visible).
 */
export async function startOrderAlertLoop(
  maxMs: number = ORDER_ALERT_LOOP_MS,
): Promise<boolean> {
  const audio = getLoopAudio();
  if (!audio || isOrderSoundMuted()) {
    return false;
  }

  const armTimer = () => {
    if (loopTimer) {
      clearTimeout(loopTimer);
    }
    loopTimer = setTimeout(stopOrderAlertLoop, maxMs);
  };

  if (looping) {
    armTimer();
    return true;
  }

  audio.loop = true;
  audio.volume = 0.9;
  try {
    audio.currentTime = 0;
  } catch {
    // ignore
  }
  try {
    looping = true;
    armTimer();
    emit();
    await audio.play();
    return true;
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.warn('[vendor-order-sound] loop blocked', error);
    stopOrderAlertLoop();
    clearUnlocked();
    return false;
  }
}

export function stopOrderAlertLoop(): void {
  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }
  const audio = getLoopAudio();
  if (audio) {
    audio.loop = false;
    silence(audio);
  }
  if (looping) {
    looping = false;
    emit();
  }
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
