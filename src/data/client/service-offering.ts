import type {
  CreateServiceOfferingInput,
  QueryOptions,
  ServiceOffering,
  ServiceOfferingPaginator,
  ServiceOfferingQueryOptions,
} from '@/types'
import { API_ENDPOINTS } from './api-endpoints'
import { crudFactory } from './curd-factory'
import { HttpClient } from './http-client'

export const serviceOfferingClient = {
  ...crudFactory<
    ServiceOffering,
    QueryOptions,
    CreateServiceOfferingInput
  >(API_ENDPOINTS.SERVICE_OFFERINGS),

  paginated: ({
    shop_id,
    search,
    service_category_id,
    service_location_id,
    offering_type_id,
    status,
    ...params
  }: Partial<ServiceOfferingQueryOptions>) => {
    return HttpClient.get<ServiceOfferingPaginator>(API_ENDPOINTS.SERVICE_OFFERINGS, {
      shop_id,
      page: params.page,
      limit: params.limit,
      search,
      service_category_id,
      service_location_id,
      offering_type_id,
      status,
    })
  },

  getById: ({ id }: { id: string }) => {
    return HttpClient.get<ServiceOffering>(`${API_ENDPOINTS.SERVICE_OFFERINGS}/${id}`)
  },
}

