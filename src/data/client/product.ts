import {
  Product,
  CreateProduct,
  ProductPaginator,
  QueryOptions,
  GetParams,
  ProductQueryOptions,
  GenerateDescriptionInput,
  AttributeTemplateResponse,
  ProductAiImageGenerationApproveResponse,
  ProductAiImageGenerationEnqueueResponse,
  ProductAiImageGenerationPreviewResponse,
  ProductAiImageGenerationRejectResponse,
  ProductAiImageGenerationStatus,
} from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { crudFactory } from './curd-factory';
import { HttpClient } from './http-client';

const PRODUCTS_WITH =
  'type;shop;categories;tags;variations.attribute.values;variation_options;variation_options.digital_file;author;digital_file';

export const productClient = {
  ...crudFactory<Product, QueryOptions, CreateProduct>(API_ENDPOINTS.PRODUCTS),
  async get({ slug, language }: GetParams) {
    const url = `${API_ENDPOINTS.PRODUCTS}/${slug}`;
    const params = {
      language,
      with: PRODUCTS_WITH,
    };
    console.log('[Edit Product API] request', {
      endpoint: 'GET /api/products/{slug}',
      slug,
      language,
      url,
      params,
    });
    try {
      const result = await HttpClient.get<Product>(url, params);
      console.log('[Edit Product API] response success', {
        hasProduct: !!result,
        productId: (result as any)?.id,
        productName: (result as any)?.name,
        productSlug: (result as any)?.slug,
        resultType: result === null ? 'null' : typeof result,
        resultKeys: result && typeof result === 'object' ? Object.keys(result) : [],
      });
      return result;
    } catch (err: any) {
      console.log('[Edit Product API] response error', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      throw err;
    }
  },
  paginated: ({
    type,
    name,
    categories,
    shop_id,
    product_type,
    status,
    ...params
  }: Partial<ProductQueryOptions>) => {
    return HttpClient.get<ProductPaginator>(API_ENDPOINTS.PRODUCTS, {
      searchJoin: 'and',
      with: 'shop;type;categories',
      shop_id,
      ...params,
      search: HttpClient.formatSearchParams({
        type,
        name,
        categories,
        shop_id,
        product_type,
        status,
      }),
    });
  },
  popular({ shop_id, ...params }: Partial<ProductQueryOptions>) {
    return HttpClient.get<Product[]>(API_ENDPOINTS.POPULAR_PRODUCTS, {
      searchJoin: 'and',
      with: 'type;shop',
      ...params,
      search: HttpClient.formatSearchParams({ shop_id }),
    });
  },
  lowStock({ shop_id, ...params }: Partial<ProductQueryOptions>) {
    return HttpClient.get<Product[]>(
      API_ENDPOINTS.LOW_STOCK_PRODUCTS_ANALYTICS,
      {
        searchJoin: 'and',
        with: 'type;shop',
        ...params,
        search: HttpClient.formatSearchParams({ shop_id }),
      },
    );
  },
  generateDescription: (data: GenerateDescriptionInput) => {
    return HttpClient.post<any>(API_ENDPOINTS.GENERATE_DESCRIPTION, data);
  },
  newOrInActiveProducts: async ({
    user_id,
    shop_id,
    status,
    name,
    ...params
  }: Partial<ProductQueryOptions>) => {
    const requestParams = {
      searchJoin: 'and',
      user_id,
      shop_id,
      status,
      name,
      ...params,
      search: HttpClient.formatSearchParams({
        status,
        name,
      }),
    };
    console.log('[Draft Products API] request', {
      endpoint: 'GET /api/draft-products',
      params: requestParams,
    });
    try {
      const result = await HttpClient.get<ProductPaginator>(
        API_ENDPOINTS.NEW_OR_INACTIVE_PRODUCTS,
        requestParams,
      );
      console.log('[Draft Products API] response success', {
        hasData: !!result,
        dataLength: Array.isArray((result as any)?.data)
          ? (result as any).data.length
          : undefined,
        productsLength: Array.isArray((result as any)?.products)
          ? (result as any).products.length
          : undefined,
        keys: result ? Object.keys(result) : [],
      });
      return result;
    } catch (err: any) {
      console.log('[Draft Products API] response error', {
        message: err?.message,
        status: err?.response?.status,
      });
      throw err;
    }
  },
  lowOrOutOfStockProducts: ({
    user_id,
    shop_id,
    status,
    categories,
    name,
    type,
    ...params
  }: Partial<ProductQueryOptions>) => {
    return HttpClient.get<ProductPaginator>(
      API_ENDPOINTS.LOW_OR_OUT_OF_STOCK_PRODUCTS,
      {
        searchJoin: 'and',
        user_id,
        shop_id,
        status,
        name,
        ...params,
        search: HttpClient.formatSearchParams({
          status,
          name,
          categories,
          type,
        }),
      },
    );
  },
  productByCategory({
    limit,
    language,
  }: {
    limit?: number;
    language?: string;
  }) {
    return HttpClient.get<any>(API_ENDPOINTS.CATEGORY_WISE_PRODUCTS, {
      limit,
      language,
    });
  },
  // productByCategory({ shop_id, ...params }: Partial<ProductQueryOptions>) {
  //   return HttpClient.get<Product[]>(API_ENDPOINTS.CATEGORY_WISE_PRODUCTS, {
  //     searchJoin: 'and',
  //     ...params,
  //     search: HttpClient.formatSearchParams({ shop_id }),
  //   });
  // },
  mostSoldProductByCategory({
    shop_id,
    ...params
  }: Partial<ProductQueryOptions>) {
    return HttpClient.get<Product[]>(
      API_ENDPOINTS.CATEGORY_WISE_PRODUCTS_SALE,
      {
        searchJoin: 'and',
        ...params,
        search: HttpClient.formatSearchParams({ shop_id }),
      },
    );
  },
  getProductsByFlashSale: ({
    user_id,
    shop_id,
    slug,
    name,
    ...params
  }: any) => {
    return HttpClient.get<ProductPaginator>(
      API_ENDPOINTS.PRODUCTS_BY_FLASH_SALE,
      {
        searchJoin: 'and',
        user_id,
        shop_id,
        slug,
        name,
        ...params,
        search: HttpClient.formatSearchParams({
          name,
        }),
      },
    );
  },
  topRated({ shop_id, ...params }: Partial<ProductQueryOptions>) {
    return HttpClient.get<Product[]>(API_ENDPOINTS.TOP_RATED_PRODUCTS, {
      searchJoin: 'and',
      ...params,
      search: HttpClient.formatSearchParams({ shop_id }),
    });
  },
  // EAV: get product attribute template by category (API returns { code, status, message, data }; we return data)
  getAttributeTemplateByCategory(categoryId: string | number) {
    return HttpClient.get<AttributeTemplateResponse>(
      `${API_ENDPOINTS.PRODUCT_ATTRIBUTE_TEMPLATE_BY_CATEGORY}/${categoryId}`,
    );
  },
  enqueueAiImageGeneration(productId: string | number) {
    return HttpClient.post<ProductAiImageGenerationEnqueueResponse>(
      `${API_ENDPOINTS.PRODUCTS}/${productId}/${API_ENDPOINTS.PRODUCT_AI_IMAGE_GENERATION}`,
      {},
    );
  },
  getAiImageGenerationStatus(productId: string | number) {
    return HttpClient.get<ProductAiImageGenerationStatus>(
      `${API_ENDPOINTS.PRODUCTS}/${productId}/${API_ENDPOINTS.PRODUCT_AI_IMAGE_GENERATION}/status`,
    );
  },
  getAiImageGenerationPreview(productId: string | number) {
    return HttpClient.get<ProductAiImageGenerationPreviewResponse>(
      `${API_ENDPOINTS.PRODUCTS}/${productId}/${API_ENDPOINTS.PRODUCT_AI_IMAGE_GENERATION}/preview`,
    );
  },
  approveAiImageGenerationPreview(productId: string | number) {
    return HttpClient.post<ProductAiImageGenerationApproveResponse>(
      `${API_ENDPOINTS.PRODUCTS}/${productId}/${API_ENDPOINTS.PRODUCT_AI_IMAGE_GENERATION}/approve`,
      {},
    );
  },
  rejectAiImageGenerationPreview(productId: string | number) {
    return HttpClient.post<ProductAiImageGenerationRejectResponse>(
      `${API_ENDPOINTS.PRODUCTS}/${productId}/${API_ENDPOINTS.PRODUCT_AI_IMAGE_GENERATION}/reject`,
      {},
    );
  },
};
