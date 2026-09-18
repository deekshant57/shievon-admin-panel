import Router, { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { useTranslation } from 'next-i18next'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { API_ENDPOINTS } from '@/data/client/api-endpoints'
import { serviceCategoryClient } from '@/data/client/service-category'
import type {
  CreateServiceCategoryInput,
  ServiceCategory,
  ServiceCategoryListPayload,
  ServiceCategoryPaginator,
  ServiceCategoryQueryOptions,
} from '@/types'
import { mapPaginatorData } from '@/utils/data-mappers'
import { Routes } from '@/config/routes'
import { Config } from '@/config'

function listPayloadToPaginator(
  payload: ServiceCategoryListPayload | undefined,
): ServiceCategoryPaginator | undefined {
  if (!payload?.paginator) return undefined
  const { data, paginator } = payload
  const page = paginator.page ?? 1
  const limit = paginator.limit ?? 15
  const totalPages = paginator.totalPages ?? 1
  const total = paginator.total ?? 0

  return {
    data: data ?? [],
    current_page: page,
    per_page: limit,
    last_page: totalPages,
    total,
    first_page_url: '',
    from: 0,
    last_page_url: '',
    links: [],
    next_page_url: null,
    path: '',
    prev_page_url: null,
    to: 0,
  }
}

export const useCreateServiceCategoryMutation = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { t } = useTranslation()

  return useMutation(serviceCategoryClient.create, {
    onSuccess: async () => {
      const shop = router.query.shop as string
      const url = shop
        ? `/${shop}${Routes.serviceCategory.list}`
        : Routes.serviceCategory.list
      await Router.push(url, undefined, { locale: Config.defaultLanguage })
      toast.success(t('common:successfully-created'))
    },
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.SERVICE_CATEGORIES)
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data?.message}`))
    },
  })
}

export const useUpdateServiceCategoryMutation = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation(
    (input: Partial<CreateServiceCategoryInput> & { id: number }) =>
      serviceCategoryClient.update(input),
    {
      onSuccess: async (data: ServiceCategory) => {
        const shop = router.query.shop as string
        const base = shop
          ? `/${shop}${Routes.serviceCategory.list}`
          : Routes.serviceCategory.list
        const param = String(data?.slug ?? data?.id ?? '')
        await router.push(`${base}/${param}/edit`, undefined, {
          locale: Config.defaultLanguage,
        })
        toast.success(t('common:successfully-updated'))
      },
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.SERVICE_CATEGORIES)
      },
      onError: (error: any) => {
        toast.error(t(`common:${error?.response?.data?.message}`))
      },
    },
  )
}

export const useDeleteServiceCategoryMutation = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation(serviceCategoryClient.delete, {
    onSuccess: () => {
      toast.success(t('common:successfully-deleted'))
    },
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.SERVICE_CATEGORIES)
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data?.message}`))
    },
  })
}

export const useToggleServiceCategoryServiceabilityMutation = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation(serviceCategoryClient.toggleServiceability, {
    onSuccess: () => {
      toast.success(t('common:successfully-updated'))
    },
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.SERVICE_CATEGORIES)
    },
  })
}

export const useServiceCategoryQuery = ({
  param,
  enabled = true,
}: {
  param?: string
  enabled?: boolean
}) => {
  const shouldRun = Boolean(param) && enabled

  const { data, error, isLoading } = useQuery<ServiceCategory, Error>(
    [API_ENDPOINTS.SERVICE_CATEGORIES, { param }],
    () =>
      serviceCategoryClient.getByParam(param as string | number),
    { enabled: shouldRun },
  )

  return {
    serviceCategory: data,
    error,
    isLoading,
  }
}

export const useServiceCategoriesQuery = (
  options: Partial<ServiceCategoryQueryOptions>,
  queryOptions?: { enabled?: boolean },
) => {
  const { data, error, isLoading } = useQuery<
    ServiceCategoryListPayload,
    Error
  >(
    [API_ENDPOINTS.SERVICE_CATEGORIES, options],
    ({ queryKey, pageParam }) =>
      serviceCategoryClient.paginated(
        Object.assign({}, queryKey[1], pageParam),
      ),
    {
      keepPreviousData: true,
      ...queryOptions,
    },
  )

  const paginatorSource = listPayloadToPaginator(data)

  return {
    serviceCategories: data?.data ?? [],
    paginatorInfo: mapPaginatorData(paginatorSource),
    error,
    loading: isLoading,
  }
}
