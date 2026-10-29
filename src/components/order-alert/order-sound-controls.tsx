import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import { enableOrderAlertSound } from '@/utils/play-new-order-alert-sound';
import {
  isOrderRealtimeEnabled,
  useOrderAlerts,
} from '@/utils/order-alert/use-order-alerts';

const SpeakerIcon = ({ muted }: { muted: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {muted ? (
      <>
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </>
    ) : (
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
    )}
  </svg>
);

/**
 * Sits next to the order bell: a persistent "Click to enable order sounds" pill
 * while the browser has not allowed audio yet (so a blocked sound is never
 * silent), and a per-browser mute toggle.
 */
const OrderSoundControls = () => {
  const { t } = useTranslation('common');
  const { unlocked, muted, setMuted } = useOrderAlerts();

  if (!isOrderRealtimeEnabled()) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {!unlocked && !muted ? (
        <button
          type="button"
          onClick={() => void enableOrderAlertSound()}
          className="whitespace-nowrap rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          {t('text-order-sound-enable')}
        </button>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={muted}
        aria-label={t('text-order-sound-mute')}
        title={
          muted ? t('text-order-sound-unmute') : t('text-order-sound-mute')
        }
        onClick={() => setMuted(!muted)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent',
          muted ? 'text-red-500' : 'text-gray-600',
        )}
      >
        <SpeakerIcon muted={muted} />
      </button>
    </div>
  );
};

export default OrderSoundControls;
