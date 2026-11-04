// Cafe / Salon service offerings use the same AI image job shape as products.
import type {
  ProductAiImageJobStatus,
  ProductAiImageGenerationStatus,
  ProductAiImageGenerationEnqueueResponse,
  ProductAiImageGenerationPreviewResponse,
  ProductAiImageGenerationApproveResponse,
  ProductAiImageGenerationRejectResponse,
} from '@/types'

export type ServiceAiImageJobStatus = ProductAiImageJobStatus
export type ServiceAiImageGenerationStatus = ProductAiImageGenerationStatus
export type ServiceAiImageGenerationEnqueueResponse = ProductAiImageGenerationEnqueueResponse
export type ServiceAiImageGenerationPreviewResponse = ProductAiImageGenerationPreviewResponse
export type ServiceAiImageGenerationApproveResponse = ProductAiImageGenerationApproveResponse
export type ServiceAiImageGenerationRejectResponse = ProductAiImageGenerationRejectResponse
