import { crudFactory } from '@/data/client/curd-factory';
import { CreateTypeInput, QueryOptions, Type, TypeQueryOptions } from '@/types';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import { HttpClient } from '@/data/client/http-client';

export const typeClient = {
  ...crudFactory<Type, QueryOptions, CreateTypeInput>(API_ENDPOINTS.TYPES),
  all: ({ name, ...params }: Partial<TypeQueryOptions>) => {
    return HttpClient.get<Type[]>(API_ENDPOINTS.TYPES, {
      searchJoin: 'and',
      ...params,
      search: HttpClient.formatSearchParams({ name }),
    });
  },
  toggleServiceability: ({ id, is_serviceable }: { id: string; is_serviceable: boolean }) => {
    return HttpClient.put<Type>(`${API_ENDPOINTS.TYPES}/${id}`, { is_serviceable });
  },
};
