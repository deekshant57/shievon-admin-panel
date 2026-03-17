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
import { mapPaginatorData } from '@/utils/data-mappers'
import { Routes } from '@/config/routes'
import { Config } from '@/config'

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

  return {
    serviceOfferings: items,
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  }
}

