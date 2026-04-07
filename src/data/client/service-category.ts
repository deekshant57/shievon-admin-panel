import type {
  CreateServiceCategoryInput,
  ServiceCategory,
  ServiceCategoryListPayload,
  ServiceCategoryQueryOptions,
} from '@/types'
import { API_ENDPOINTS } from './api-endpoints'
import { HttpClient } from './http-client'

export const serviceCategoryClient = {
  paginated: (params: Partial<ServiceCategoryQueryOptions>) => {
    return HttpClient.get<ServiceCategoryListPayload>(
      API_ENDPOINTS.SERVICE_CATEGORIES,
      {
        parent_id: params.parent_id,
        search: params.search,
        page: params.page,
        limit: params.limit,
      },
    )
  },

  getByParam: (param: string | number) => {
    const encoded = encodeURIComponent(String(param))
    return HttpClient.get<ServiceCategory>(
      `${API_ENDPOINTS.SERVICE_CATEGORIES}/${encoded}`,
    )
  },

  create: (data: CreateServiceCategoryInput) => {
    return HttpClient.post<ServiceCategory>(
      API_ENDPOINTS.SERVICE_CATEGORIES,
      data,
    )
  },

  update: ({
    id,
    ...input
  }: Partial<CreateServiceCategoryInput> & { id: number }) => {
    return HttpClient.put<ServiceCategory>(
      `${API_ENDPOINTS.SERVICE_CATEGORIES}/${id}`,
      input,
    )
  },

  delete: ({ id }: { id: number }) => {
    return HttpClient.delete<ServiceCategory>(
      `${API_ENDPOINTS.SERVICE_CATEGORIES}/${id}`,
    )
  },
}
