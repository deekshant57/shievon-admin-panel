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
  // GET /api/shops – supports orderBy, sortedBy, text, search, limit, page
  paginated: ({ name, ...params }: Partial<ShopQueryOptions>) => {
    return HttpClient.get<ShopPaginator>(API_ENDPOINTS.SHOPS, {
      searchJoin: 'and',
      text: name ?? undefined,
      search: name ? HttpClient.formatSearchParams({ name }) : undefined,
      ...params,
    });
  },
  // GET /api/new-shops – supports orderBy, sortedBy, text, search, limit, page, is_active
  newOrInActiveShops: ({
    is_active,
    name,
    ...params
  }: Partial<ShopQueryOptions>) => {
    return HttpClient.get<ShopPaginator>(API_ENDPOINTS.NEW_OR_INACTIVE_SHOPS, {
      searchJoin: 'and',
      text: name ?? undefined,
      search:
        name || is_active !== undefined
          ? HttpClient.formatSearchParams({ is_active, name })
          : undefined,
      ...(is_active !== undefined && { is_active }),
      ...params,
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
  toggleServiceability: ({ id, is_serviceable }: { id: string; is_serviceable: boolean }) => {
    return HttpClient.put<Shop>(`${API_ENDPOINTS.SHOPS}/${id}`, { is_serviceable });
  },
};
