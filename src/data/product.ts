import Router, { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import { productClient } from './client/product';
import {
  ProductQueryOptions,
  GetParams,
  ProductPaginator,
  Product,
  AttributeTemplateResponse,
} from '@/types';
import { mapPaginatorData } from '@/utils/data-mappers';
import { Routes } from '@/config/routes';
import { Config } from '@/config';

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();
  return useMutation(productClient.create, {
    onSuccess: async () => {
      const generateRedirectUrl = router.query.shop
        ? `/${router.query.shop}${Routes.product.list}`
        : Routes.product.list;
      await Router.push(generateRedirectUrl, undefined, {
        locale: Config.defaultLanguage,
      });
      toast.success(t('common:successfully-created'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
    },
    onError: (error: any) => {
      const { data, status } = error?.response;
      if (status === 422) {
        const errorMessage: any = Object.values(data).flat();
        toast.error(errorMessage[0]);
      } else {
        toast.error(t(`common:${error?.response?.data.message}`));
      }
    },
  });
};

export const useUpdateProductMutation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation(productClient.update, {
    onSuccess: async (data) => {
      const generateRedirectUrl = router.query.shop
        ? `/${router.query.shop}${Routes.product.list}`
        : Routes.product.list;
      await router.push(
        `${generateRedirectUrl}/${data?.slug}/edit`,
        undefined,
        {
          locale: Config.defaultLanguage,
        },
      );
      toast.success(t('common:successfully-updated'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data.message}`));
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation(productClient.delete, {
    onSuccess: () => {
      toast.success(t('common:successfully-deleted'));
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
    },
    onError: (error: any) => {
      toast.error(t(`common:${error?.response?.data.message}`));
    },
  });
};

export const useProductQuery = ({ slug, language }: GetParams) => {
  const enabled = Boolean(slug);
  console.log('[useProductQuery] params', { slug, language, enabled });

  const { data, error, isLoading } = useQuery<Product, Error>(
    [API_ENDPOINTS.PRODUCTS, { slug, language }],
    () => productClient.get({ slug, language }),
    {
      enabled,
    },
  );

  console.log('[useProductQuery] result', {
    loading: isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    hasProduct: !!data,
    productId: data?.id,
    productName: (data as any)?.name,
    productSlug: (data as any)?.slug,
  });

  return {
    product: data,
    error,
    isLoading,
  };
};

// EAV: load product attribute template by category
export const useProductAttributeTemplateByCategoryQuery = (
  categoryId?: string | number,
  options: any = {},
) => {
  const enabled = Boolean(categoryId) && (options?.enabled ?? true);

  const { data, error, isLoading } = useQuery<AttributeTemplateResponse, Error>(
    [API_ENDPOINTS.PRODUCT_ATTRIBUTE_TEMPLATE_BY_CATEGORY, categoryId],
    () =>
      productClient.getAttributeTemplateByCategory(
        categoryId as string | number,
      ),
    {
      enabled,
      ...options,
    },
  );

  return {
    template: data,
    error,
    loading: isLoading,
  };
};

export const useProductsQuery = (
  params: Partial<ProductQueryOptions>,
  options: any = {},
) => {
  const { data, error, isLoading } = useQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.PRODUCTS, params],
    ({ queryKey, pageParam }) =>
      productClient.paginated(Object.assign({}, queryKey[1], pageParam)),
    {
      keepPreviousData: true,
      ...options,
    },
  );

  // Support both { data: Product[] } and { products: Product[] } from API
  const products =
    data?.data ?? (data as { products?: Product[] } | undefined)?.products ?? [];

  return {
    products,
    paginatorInfo: mapPaginatorData(normalizePaginatorData(data)),
    error,
    loading: isLoading,
  };
};

export const useGenerateDescriptionMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  return useMutation(productClient.generateDescription, {
    onSuccess: () => {
      toast.success(t('Generated...'));
    },
    // Always refetch after error or success:
    onSettled: (data) => {
      queryClient.refetchQueries(API_ENDPOINTS.GENERATE_DESCRIPTION);
      data;
    },
  });
};

export const useInActiveProductsQuery = (
  options: Partial<ProductQueryOptions>,
  queryOptions: any = {},
) => {
  console.log('[useInActiveProductsQuery] params', {
    ...options,
    enabled: queryOptions?.enabled,
  });

  const { data, error, isLoading } = useQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.NEW_OR_INACTIVE_PRODUCTS, options],
    ({ queryKey, pageParam }) =>
      productClient.newOrInActiveProducts(
        Object.assign({}, queryKey[1], pageParam),
      ),
    {
      keepPreviousData: true,
      ...queryOptions,
    },
  );

  // Support both { data: Product[] } and { products: Product[] } from API
  const products =
    data?.data ?? (data as { products?: Product[] } | undefined)?.products ?? [];

  console.log('[useInActiveProductsQuery] result', {
    loading: isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    hasData: !!data,
    productsCount: products.length,
    dataKeys: data ? Object.keys(data as object) : [],
  });

  if (data && products.length === 0) {
    console.warn('[useInActiveProductsQuery] data present but products array empty', {
      hasDataKey: 'data' in (data as object),
      hasProductsKey: 'products' in (data as object),
      keys: Object.keys(data as object),
    });
  }

  return {
    products,
    paginatorInfo: mapPaginatorData(normalizePaginatorData(data)),
    error,
    loading: isLoading,
  };
};

/** Normalize paginator so it has .data for list (some backends return .products) */
function normalizePaginatorData(
  data: ProductPaginator | undefined,
): ProductPaginator | undefined {
  if (!data) return undefined;
  const d = data as ProductPaginator & { products?: Product[] };
  if (d.data != null) return data;
  if (Array.isArray(d.products)) {
    return { ...d, data: d.products } as ProductPaginator;
  }
  return data;
}

export const useProductStockQuery = (options: Partial<ProductQueryOptions>) => {
  const { data, error, isLoading } = useQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.LOW_OR_OUT_OF_STOCK_PRODUCTS, options],
    ({ queryKey, pageParam }) =>
      productClient.lowOrOutOfStockProducts(
        Object.assign({}, queryKey[1], pageParam),
      ),
    {
      keepPreviousData: true,
    },
  );

  return {
    products: data?.data ?? [],
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  };
};

// Read All products by flash sale

export const useProductsByFlashSaleQuery = (options: any) => {
  const { data, error, isLoading } = useQuery<ProductPaginator, Error>(
    [API_ENDPOINTS.PRODUCTS_BY_FLASH_SALE, options],
    ({ queryKey, pageParam }) =>
      productClient.getProductsByFlashSale(
        Object.assign({}, queryKey[1], pageParam),
      ),
    {
      keepPreviousData: true,
    },
  );

  return {
    products: data?.data ?? [],
    paginatorInfo: mapPaginatorData(data),
    error,
    loading: isLoading,
  };
};
