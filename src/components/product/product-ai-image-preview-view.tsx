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

type ProductAiImagePreviewModalPayload = {
  productId: string;
  productName?: string;
};

const PreviewImageGrid = ({
  title,
  images,
}: {
  title: string;
  images: string[];
}) => {
  if (!images.length) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-heading">{title}</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.map((imageUrl, index) => (
          <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded border">
            <img
              src={imageUrl}
              alt={`${title} ${index + 1}`}
              className="h-28 w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ProductAiImagePreviewView() {
  const { t } = useTranslation('common');
  const { closeModal } = useModalAction();
  const queryClient = useQueryClient();
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

  return (
    <div className="flex h-full min-h-screen w-screen flex-col bg-light p-4 md:h-auto md:min-h-0 md:max-w-[920px] md:rounded-xl md:p-6">
      <div className="mb-4 border-b pb-3">
        <h2 className="text-base font-semibold text-heading">
          {t('text-ai-image-preview')}
        </h2>
        {productName && <p className="mt-1 text-sm text-body">{productName}</p>}
      </div>

      {isLoading && (
        <p className="py-8 text-center text-sm text-body">
          {t('text-loading')}
        </p>
      )}

      {!isLoading && error && (
        <Alert
          variant="errorOutline"
          message={
            t('text-ai-preview-not-found')
          }
        />
      )}

      {!isLoading && previewData && (
        <div className="space-y-5">
          <PreviewImageGrid
            title={t('text-source-images')}
            images={previewData.source_images ?? []}
          />
          <PreviewImageGrid
            title={t('text-generated-preview-images')}
            images={previewData.preview_images ?? []}
          />
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
                rejectPreview(productId, {
                  onSuccess: closeAndRefresh,
                });
              }}
            >
              {t('text-reject-preview')}
            </Button>
            <Button
              disabled={isSubmitting || !productId}
              loading={approving}
              onClick={() => {
                if (!productId) return;
                approvePreview(productId, {
                  onSuccess: closeAndRefresh,
                })
              }}
            >
              {t('text-approve-preview')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
