import Router, { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { useTranslation } from 'next-i18next'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { API_ENDPOINTS } from '@/data/client/api-endpoints'
import { serviceOfferingClient } from '@/data/client/service-offering'
import type {
  CreateServiceOfferingInput,
  ServiceOffering,
  ServiceOfferingPaginator,
  ServiceOfferingQueryOptions,
} from '@/types'
import type {
  ServiceAiImageGenerationApproveResponse,
  ServiceAiImageGenerationEnqueueResponse,
  ServiceAiImageGenerationPreviewResponse,
  ServiceAiImageGenerationRejectResponse,
  ServiceAiImageGenerationStatus,
} from '@/types/service-ai'
import { mapPaginatorData } from '@/utils/data-mappers'
import { Routes } from '@/config/routes'
import { Config } from '@/config'
import { getApiErrorMessage } from '@/data/client/http-client'

export const useCreateServiceOfferingMutation = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { t } = useTranslation()

  return useMutation(serviceOfferingClient.create, {
    onSuccess: async () => {
      const generateRedirectUrl = router.query.shop
        ? `/${router.query.shop}${Routes.serviceOffering.list}`
        : Routes.serviceOffering.list
      await Router.push(generateRedirectUrl, undefined, {
        locale: Config.defaultLanguage,
      })
      toast.success(t('common:successfully-created'))
    },
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.SERVICE_OFFERINGS)
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data?.message}`))
    },
  })
}

export const useUpdateServiceOfferingMutation = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation(serviceOfferingClient.update, {
    onSuccess: async (data: ServiceOffering) => {
      const generateRedirectUrl = router.query.shop
        ? `/${router.query.shop}${Routes.serviceOffering.list}`
        : Routes.serviceOffering.list
      // keep user on edit screen
      await router.push(
        `${generateRedirectUrl}/${data?.id}/edit`,
        undefined,
        { locale: Config.defaultLanguage },
      )
      toast.success(t('common:successfully-updated'))
    },
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.SERVICE_OFFERINGS)
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data?.message}`))
    },
  })
}

export const useDeleteServiceOfferingMutation = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation(serviceOfferingClient.delete, {
    onSuccess: () => {
      toast.success(t('common:successfully-deleted'))
    },
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.SERVICE_OFFERINGS)
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data?.message}`))
    },
  })
}

export const useServiceOfferingQuery = (
  { id }: { id?: string },
  options: any = {},
) => {
  const enabled = Boolean(id) && (options?.enabled ?? true)

  const { data, error, isLoading } = useQuery<ServiceOffering, Error>(
    [API_ENDPOINTS.SERVICE_OFFERINGS, { id }],
    () => serviceOfferingClient.getById({ id: id as string }),
    { enabled, ...options },
  )

  return {
    serviceOffering: data,
    error,
    loading: isLoading,
  }
}

export const useServiceOfferingsQuery = (
  params: Partial<ServiceOfferingQueryOptions>,
  options: any = {},
) => {
  const { data, error, isLoading } = useQuery<ServiceOfferingPaginator, Error>(
    [API_ENDPOINTS.SERVICE_OFFERINGS, params],
    ({ queryKey, pageParam }) =>
      serviceOfferingClient.paginated(Object.assign({}, queryKey[1], pageParam)),
    {
      keepPreviousData: true,
      ...options,
    },
  )

  const items = data?.data ?? []
  const normalizedPaginator = normalizeServicePaginatorData(data)

  return {
    serviceOfferings: items,
    paginatorInfo: mapPaginatorData(normalizedPaginator),
    error,
    loading: isLoading,
  }
}

type ServiceOfferingPaginatorWithNestedData = ServiceOfferingPaginator & {
  paginator?: ServiceOfferingPaginator & {
    page?: number
    limit?: number
    totalPages?: number
    currentPage?: number
    perPage?: number
    lastPage?: number
  }
}

function normalizeServicePaginatorData(
  data: ServiceOfferingPaginator | undefined,
): ServiceOfferingPaginator | undefined {
  if (!data) return undefined

  const paginatorFromNestedData = (data as ServiceOfferingPaginatorWithNestedData)
    ?.paginator
  if (paginatorFromNestedData) {
    const currentPage =
      paginatorFromNestedData.current_page ??
      paginatorFromNestedData.currentPage ??
      paginatorFromNestedData.page
    const perPage =
      paginatorFromNestedData.per_page ??
      paginatorFromNestedData.perPage ??
      paginatorFromNestedData.limit
    const lastPage =
      paginatorFromNestedData.last_page ??
      paginatorFromNestedData.lastPage ??
      paginatorFromNestedData.totalPages

    return {
      ...paginatorFromNestedData,
      current_page: currentPage,
      per_page: perPage,
      last_page: lastPage,
      data: data?.data ?? paginatorFromNestedData?.data ?? [],
    } as ServiceOfferingPaginator
  }

  return data
}


// ---- AI image enhancement for Cafe / Salon offerings (separate from products) ----

export const useEnqueueServiceAiImageGenerationMutation = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation('common')

  return useMutation<
    ServiceAiImageGenerationEnqueueResponse,
    unknown,
    string | number
  >((id) => serviceOfferingClient.enqueueAiImageGeneration(id), {
    onSuccess: (_data, id) => {
      toast.success(t('text-ai-image-job-queued'))
      queryClient.invalidateQueries([
        API_ENDPOINTS.SERVICE_AI_IMAGE_GENERATION_STATUS,
        id,
      ])
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export const useServiceAiImageGenerationStatusQuery = (
  id?: string | number,
  options: any = {},
) => {
  const enabled = Boolean(id) && (options?.enabled ?? true)

  return useQuery<ServiceAiImageGenerationStatus, Error>(
    [API_ENDPOINTS.SERVICE_AI_IMAGE_GENERATION_STATUS, id],
    () => serviceOfferingClient.getAiImageGenerationStatus(id as string | number),
    { enabled, ...options },
  )
}

export const useServiceAiImageGenerationPreviewQuery = (
  id?: string | number,
  options: any = {},
) => {
  const enabled = Boolean(id) && (options?.enabled ?? true)

  return useQuery<ServiceAiImageGenerationPreviewResponse, Error>(
    [API_ENDPOINTS.SERVICE_AI_IMAGE_GENERATION_PREVIEW, id],
    () => serviceOfferingClient.getAiImageGenerationPreview(id as string | number),
    { enabled, ...options },
  )
}

export const useApproveServiceAiImageGenerationMutation = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation('common')

  return useMutation<
    ServiceAiImageGenerationApproveResponse,
    unknown,
    string | number
  >((id) => serviceOfferingClient.approveAiImageGenerationPreview(id), {
    onSuccess: (_data, id) => {
      toast.success(t('text-ai-image-preview-approved'))
      // Approve replaces the offering's images, so refresh the list too.
      queryClient.invalidateQueries(API_ENDPOINTS.SERVICE_OFFERINGS)
      queryClient.invalidateQueries([
        API_ENDPOINTS.SERVICE_AI_IMAGE_GENERATION_STATUS,
        id,
      ])
      queryClient.invalidateQueries([
        API_ENDPOINTS.SERVICE_AI_IMAGE_GENERATION_PREVIEW,
        id,
      ])
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export const useRejectServiceAiImageGenerationMutation = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation('common')

  return useMutation<
    ServiceAiImageGenerationRejectResponse,
    unknown,
    string | number
  >((id) => serviceOfferingClient.rejectAiImageGenerationPreview(id), {
    onSuccess: (_data, id) => {
      toast.success(t('text-ai-image-preview-rejected'))
      queryClient.invalidateQueries([
        API_ENDPOINTS.SERVICE_AI_IMAGE_GENERATION_STATUS,
        id,
      ])
      queryClient.invalidateQueries([
        API_ENDPOINTS.SERVICE_AI_IMAGE_GENERATION_PREVIEW,
        id,
      ])
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
