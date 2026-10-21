import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import {
  useApproveProductAiImageGenerationMutation,
  useProductAiImageGenerationPreviewQuery,
  useRejectProductAiImageGenerationMutation,
} from '@/data/product';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import { useModalAction, useModalState } from '@/components/ui/modal/modal.context';
import { useQueryClient } from 'react-query';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';

type ProductAiImagePreviewModalPayload = {
  productId: string;
  productName?: string;
};

/**
 * One image. object-contain, not object-cover: the vendor is deciding whether to
 * replace their photo, so they must see the whole frame, not a crop of it.
 * Clicking opens it at full size.
 */
const PreviewImage = ({
  imageUrl,
  alt,
  onZoom,
  emptyLabel,
}: {
  imageUrl?: string;
  alt: string;
  onZoom: (url: string) => void;
  emptyLabel: string;
}) => {
  if (!imageUrl) {
    return (
      <div className="flex h-56 items-center justify-center rounded border border-dashed bg-gray-50 text-xs text-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onZoom(imageUrl)}
      className="group relative block h-56 w-full overflow-hidden rounded border bg-gray-50 transition hover:border-accent"
    >
      <img src={imageUrl} alt={alt} className="h-full w-full object-contain" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[11px] text-light opacity-0 transition group-hover:opacity-100">
        {alt}
      </span>
    </button>
  );
};

export default function ProductAiImagePreviewView() {
  const { t } = useTranslation('common');
  const { closeModal } = useModalAction();
  const queryClient = useQueryClient();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const {
    data: modalData,
  } = useModalState() as { data: ProductAiImagePreviewModalPayload };

  const productId = modalData?.productId;
  const productName = modalData?.productName;

  const {
    data: previewData,
    isLoading,
    error,
  } = useProductAiImageGenerationPreviewQuery(productId, {
    enabled: Boolean(productId),
  });
  const { mutate: approvePreview, isLoading: approving } =
    useApproveProductAiImageGenerationMutation();
  const { mutate: rejectPreview, isLoading: rejecting } =
    useRejectProductAiImageGenerationMutation();

  const isSubmitting = approving || rejecting;

  const closeAndRefresh = () => {
    queryClient.invalidateQueries([API_ENDPOINTS.PRODUCT_AI_IMAGE_GENERATION_STATUS, productId]);
    queryClient.invalidateQueries([API_ENDPOINTS.PRODUCT_AI_IMAGE_GENERATION_PREVIEW, productId]);
    closeModal();
  };

  const sourceImages = previewData?.source_images ?? [];
  const generatedImages = previewData?.preview_images ?? [];
  // Pair them up so each original sits beside what the AI made from it, rather
  // than two separate rows the vendor has to compare by eye across the modal.
  const pairCount = Math.max(sourceImages.length, generatedImages.length);

  return (
    <div className="flex h-full min-h-screen w-screen flex-col bg-light p-4 md:h-auto md:min-h-0 md:max-w-[1040px] md:rounded-xl md:p-6">
      <div className="mb-4 border-b pb-3">
        <h2 className="text-base font-semibold text-heading">
          {t('text-ai-image-preview')}
        </h2>
        {productName && <p className="mt-1 text-sm text-body">{productName}</p>}
      </div>

      {isLoading && (
        <p className="py-8 text-center text-sm text-body">{t('text-loading')}</p>
      )}

      {!isLoading && error && (
        <Alert variant="errorOutline" message={t('text-ai-preview-not-found')} />
      )}

      {!isLoading && previewData && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-x-4 text-sm font-semibold text-heading">
            <span>{t('text-source-images')}</span>
            <span>{t('text-generated-preview-images')}</span>
          </div>

          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
            {Array.from({ length: pairCount }).map((_, index) => (
              <div key={index} className="grid grid-cols-2 items-center gap-x-4">
                <PreviewImage
                  imageUrl={sourceImages[index]}
                  alt={`${t('text-source-images')} ${index + 1}`}
                  onZoom={setZoomedImage}
                  emptyLabel="—"
                />
                <PreviewImage
                  imageUrl={generatedImages[index]}
                  alt={`${t('text-generated-preview-images')} ${index + 1}`}
                  onZoom={setZoomedImage}
                  emptyLabel="—"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted">{t('text-ai-preview-zoom-hint')}</p>

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
              {t('button-cancel')}
            </Button>
            <Button
              variant="outline"
              disabled={isSubmitting || !productId}
              loading={rejecting}
              onClick={() => {
                if (!productId) return;
                rejectPreview(productId, { onSuccess: closeAndRefresh });
              }}
            >
              {t('text-reject-preview')}
            </Button>
            <Button
              disabled={isSubmitting || !productId}
              loading={approving}
              onClick={() => {
                if (!productId) return;
                approvePreview(productId, { onSuccess: closeAndRefresh });
              }}
            >
              {t('text-approve-preview')}
            </Button>
          </div>
        </div>
      )}

      {/* Full-size view, layered over the modal. */}
      {zoomedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setZoomedImage(null)}
            aria-label={t('button-cancel')}
            className="absolute right-6 top-6 rounded-full bg-light/90 px-3 py-1 text-sm font-semibold text-heading"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
