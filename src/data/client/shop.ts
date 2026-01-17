import {
  QueryOptions,
  Shop,
  ShopInput,
  ShopPaginator,
  ShopQueryOptions,
  TransferShopOwnershipInput,
} from '@/types';
import { ApproveShopInput } from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { HttpClient } from './http-client';
import { crudFactory } from './curd-factory';

export const shopClient = {
  ...crudFactory<Shop, QueryOptions, ShopInput>(API_ENDPOINTS.SHOPS),
  get({ slug }: { slug: String }) {
    return HttpClient.get<Shop>(`${API_ENDPOINTS.SHOPS}/${slug}`);
  },
  paginated: ({ name, ...params }: Partial<ShopQueryOptions>) => {
    const searchParams = HttpClient.formatSearchParams({ name });
    return HttpClient.get<ShopPaginator>(API_ENDPOINTS.SHOPS, {
      searchJoin: 'and',
      ...params,
      ...(searchParams ? { search: searchParams } : {}),
    });
  },
  newOrInActiveShops: ({
    is_active,
    name,
    ...params
  }: Partial<ShopQueryOptions>) => {
    const searchParams = HttpClient.formatSearchParams({ is_active, name });
    return HttpClient.get<ShopPaginator>(API_ENDPOINTS.NEW_OR_INACTIVE_SHOPS, {
      searchJoin: 'and',
      is_active,
      name,
      ...params,
      ...(searchParams ? { search: searchParams } : {}),
    });
  },
  approve: (variables: ApproveShopInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.APPROVE_SHOP, variables);
  },
  disapprove: (variables: { id: string }) => {
    return HttpClient.post<{ id: string }>(
      API_ENDPOINTS.DISAPPROVE_SHOP,
      variables
    );
  },
  transferShopOwnership: (variables: TransferShopOwnershipInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.TRANSFER_SHOP_OWNERSHIP, variables);
  },
};
