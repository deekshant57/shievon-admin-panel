import Button from '@/components/ui/button';
import { useModalAction } from '@/components/ui/modal/modal.context';
import {
  useEnqueueProductAiImageGenerationMutation,
  useProductAiImageGenerationStatusQuery,
} from '@/data/product';
import { ProductAiImageJobStatus } from '@/types';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { getAuthCredentials } from '@/utils/auth-utils';
import { STORE_OWNER, SUPER_ADMIN } from '@/utils/constants';

type ProductAiImageActionsProps = {
  productId: string;
  productName: string;
};

const ACTIVE_PROGRESS_STATES: ProductAiImageJobStatus[] = ['queued', 'processing'];

export default function ProductAiImageActions({
  productId,
  productName,
}: ProductAiImageActionsProps) {
  const { t } = useTranslation('common');
  const { role } = getAuthCredentials();
  const { openModal } = useModalAction();
  const { mutate: enqueueJob, isLoading: enqueueing } =
    useEnqueueProductAiImageGenerationMutation();
  const { data: statusData } = useProductAiImageGenerationStatusQuery(productId, {
    refetchInterval: (status: any) =>
      ACTIVE_PROGRESS_STATES.includes(status?.status) ? 3000 : false,
  });

  const canUseAiImageActions = role === SUPER_ADMIN || role === STORE_OWNER;
  const status = statusData?.status ?? 'idle';
  const progress = statusData?.progress_percent ?? 0;
  const errorMessage = statusData?.error_message ?? null;

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

  return (
    <div className="mt-2 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Button
          size="small"
          variant="outline"
          loading={enqueueing}
          disabled={disableGenerate}
          onClick={() => enqueueJob(productId)}
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
              openModal('PRODUCT_AI_IMAGE_PREVIEW_VIEW', { productId, productName })
            }
          >
            {t('text-review-ai-images')}
          </Button>
        )}
      </div>
      {ACTIVE_PROGRESS_STATES.includes(status) && (
        <span className="text-xs text-body">
          {`${t('text-ai-progress')}: ${progress}%`}
        </span>
      )}
      {status === 'failed' && (
        <span className="max-w-[220px] text-right text-xs text-red-500">
          {errorMessage || t('text-ai-generation-failed')}
        </span>
      )}
    </div>
  );
}
