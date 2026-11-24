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
import { ProductAiImageViewItem } from '@/types';

type ProductAiImagePreviewModalPayload = {
  productId: string;
  productName?: string;
};

const viewLabel = (view: string | null | undefined, t: (k: string) => string) => {
  switch ((view || '').toLowerCase()) {
    case 'front':
      return t('form:view-type-front');
    case 'back':
      return t('form:view-type-back');
    case 'left':
    case 'right':
      return t('form:view-type-side');
    case 'detail':
      return t('form:view-type-detail');
    case 'other':
      return t('form:view-type-other');
    default:
      return t('form:view-type-unknown');
  }
};

const PreviewImageGrid = ({
  title,
  urls,
  items,
}: {
  title: string;
  urls: string[];
  items?: ProductAiImageViewItem[];
}) => {
  const { t } = useTranslation();
  const labeled =
    items && items.length > 0
      ? items
      : urls.map((url) => ({ url, view_type: null as string | null }));

  if (!labeled.length) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-heading">{title}</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {labeled.map((item, index) => (
          <div key={`${item.url}-${index}`} className="overflow-hidden rounded border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={`${title} ${index + 1}`}
              className="h-28 w-full object-cover"
            />
            <p className="border-t bg-gray-50 px-2 py-1 text-center text-xs font-medium text-heading">
              {viewLabel(item.view_type, t)}
            </p>
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

  const warnings = previewData?.warnings ?? [];

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
          {warnings.length > 0 && (
            <Alert
              variant="warningOutline"
              message={warnings
                .map((w) =>
                  w === 'possible_missing_back'
                    ? t('text-ai-warning-missing-back')
                    : w,
                )
                .join(' · ')}
            />
          )}
          <PreviewImageGrid
            title={t('text-source-images')}
            urls={previewData.source_images ?? []}
            items={previewData.source_image_items}
          />
          <PreviewImageGrid
            title={t('text-generated-preview-images')}
            urls={previewData.preview_images ?? []}
            items={previewData.preview_image_items}
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
