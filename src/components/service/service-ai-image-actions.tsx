import Button from '@/components/ui/button';
import { useModalAction } from '@/components/ui/modal/modal.context';
import {
  useEnqueueServiceAiImageGenerationMutation,
  useServiceAiImageGenerationStatusQuery,
} from '@/data/service-offering';
import { getApiErrorMessage } from '@/data/client/http-client';
import type { ServiceAiImageJobStatus } from '@/types/service-ai';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { getAuthCredentials } from '@/utils/auth-utils';
import { STORE_OWNER, SUPER_ADMIN } from '@/utils/constants';

type ServiceAiImageActionsProps = {
  serviceId: string;
  serviceName: string;
  /** The offering's type; decides which "only photos of ..." hint is shown. */
  serviceType?: { name?: string | null; slug?: string | null } | null;
};

const ACTIVE_PROGRESS_STATES: ServiceAiImageJobStatus[] = ['queued', 'processing'];

export default function ServiceAiImageActions({
  serviceId,
  serviceName,
  serviceType,
}: ServiceAiImageActionsProps) {
  const { t } = useTranslation('common');
  const { role } = getAuthCredentials();
  const { openModal } = useModalAction();
  const {
    mutate: enqueueJob,
    isLoading: enqueueing,
    error: enqueueError,
    reset: resetEnqueueError,
  } = useEnqueueServiceAiImageGenerationMutation();
  const { data: statusData } = useServiceAiImageGenerationStatusQuery(serviceId, {
    refetchInterval: (status: any) =>
      ACTIVE_PROGRESS_STATES.includes(status?.status) ? 3000 : false,
  });

  const typeKey = [serviceType?.slug, serviceType?.name]
    .map((v) => String(v ?? '').trim().toLowerCase())
    .find((v) => v === 'cafe' || v === 'salon');
  const canUseAiImageActions = role === SUPER_ADMIN || role === STORE_OWNER;
  const status = statusData?.status ?? 'idle';
  const progress = statusData?.progress_percent ?? 0;

  /**
   * Two different things can fail, and only one of them used to be visible here.
   *  - The job itself fails after it starts  -> statusData.error_message
   *  - The request to START a job is refused -> the mutation error (quota reached,
   *    service has no images, provider unreachable). That only ever appeared as a
   *    toast, which disappears before a vendor can read or act on it.
   */
  const message = useMemo(() => {
    if (enqueueError) return getApiErrorMessage(enqueueError);
    if (status === 'failed') {
      return statusData?.error_message || t('text-ai-generation-failed');
    }
    return null;
  }, [enqueueError, status, statusData?.error_message, t]);

  // The image agent names the offending photo ("Photo 2 doesn't look like ..."),
  // so the vendor knows which one to swap. Only then does "replace that photo" apply.
  const namesAPhoto =
    status === 'failed' && /^Photo \d+/.test(statusData?.error_message ?? '');

  const disableGenerate = useMemo(() => {
    return (
      enqueueing ||
      status === 'queued' ||
      status === 'processing' ||
      status === 'preview_pending'
    );
  }, [enqueueing, status]);

  if (!canUseAiImageActions) {
    return null;
  }

  const startJob = () => {
    // Clear the previous refusal so a retry doesn't show a stale reason.
    resetEnqueueError();
    enqueueJob(serviceId);
  };

  return (
    <div className="mt-2 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Button
          size="small"
          variant="outline"
          loading={enqueueing}
          disabled={disableGenerate}
          onClick={startJob}
          // title gives a hover hint, but on a button it also REPLACES the
          // accessible name, so aria-label restores the real label for
          // screen readers.
          title={t('text-ai-attempts-hint-service')}
          aria-label={t('text-enrich-images-with-ai')}
          className="h-8 px-2.5 text-xs"
        >
          {t('text-enrich-images-with-ai')}
        </Button>
        {status === 'preview_pending' && (
          <Button
            size="small"
            variant="normal"
            className="h-8 px-2.5 text-xs"
            onClick={() =>
              openModal('SERVICE_AI_IMAGE_PREVIEW_VIEW', { serviceId, serviceName })
            }
          >
            {t('text-review-ai-images')}
          </Button>
        )}
      </div>
      {typeKey && (
        <span className="max-w-[260px] text-right text-[11px] leading-snug text-muted">
          {t(`text-ai-service-hint-${typeKey}`)}
        </span>
      )}
      {ACTIVE_PROGRESS_STATES.includes(status) && (
        <span className="text-xs text-body">
          {`${t('text-ai-progress')}: ${progress}%`}
        </span>
      )}
      {message && (
        // Clamped so a long provider message can't push the table row out of
        // shape; the full text stays available on hover.
        <span
          title={message}
          className="line-clamp-5 max-w-[300px] text-right text-xs leading-snug text-red-500"
        >
          {message}
        </span>
      )}
      {namesAPhoto && (
        <span className="text-right text-xs font-medium text-heading">
          {t('text-ai-replace-photo-retry')}
        </span>
      )}
    </div>
  );
}
