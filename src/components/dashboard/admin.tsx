import RecentOrders from '@/components/order/recent-orders';
import PopularProductList from '@/components/product/popular-product-list';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import ColumnChart from '@/components/widgets/column-chart';
import WithdrawTable from '@/components/withdraw/withdraw-table';
import {
  useAnalyticsQuery,
  usePopularProductsQuery,
  useLowProductStockQuery,
  useProductByCategoryQuery,
  useTopRatedProductsQuery,
} from '@/data/dashboard';
import { useOrdersQuery } from '@/data/order';
import { useWithdrawsQuery } from '@/data/withdraw';
import usePrice from '@/utils/use-price';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import LowStockProduct from '@/components/product/product-stock';
import { useMemo, useState } from 'react';
import Search from '@/components/common/search';
import {
  DashboardHeader,
  DashboardKpiBento,
  DashboardSection,
  DashboardShell,
  OrderStatusSection,
  WidgetGrid,
  WidgetGridItem,
} from '@/components/dashboard/layout';

const ProductCountByCategory = dynamic(
  () =>
    import(
      '@/components/dashboard/widgets/table/widget-product-count-by-category'
    ),
);

const TopRatedProducts = dynamic(
  () => import('@/components/dashboard/widgets/box/widget-top-rate-product'),
);

export default function Dashboard() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const { data, isLoading: loading } = useAnalyticsQuery();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { price: total_revenue } = usePrice(
    data && {
      amount: data?.totalRevenue!,
    },
  );

  const {
    error: orderError,
    orders: orderData,
    loading: orderLoading,
    paginatorInfo: orderPaginatorInfo,
  } = useOrdersQuery({
    language: locale,
    limit: 5,
    page,
    tracking_number: searchTerm,
  });
  const {
    data: popularProductData,
    isLoading: popularProductLoading,
    error: popularProductError,
  } = usePopularProductsQuery({ limit: 10, language: locale });

  const {
    data: topRatedProducts,
    isLoading: topRatedProductsLoading,
    error: topRatedProductsError,
  } = useTopRatedProductsQuery({ limit: 10, language: locale });

  const {
    data: lowStockProduct,
    isLoading: lowStockProductLoading,
    error: lowStockProductError,
  } = useLowProductStockQuery({
    limit: 10,
    language: locale,
  });

  const {
    data: productByCategory,
    isLoading: productByCategoryLoading,
    error: productByCategoryError,
  } = useProductByCategoryQuery({ limit: 10, language: locale });

  const {
    withdraws,
    loading: withdrawLoading,
    paginatorInfo: withdrawPaginatorInfo,
  } = useWithdrawsQuery({
    limit: 10,
  });

  let salesByYear: number[] = Array.from({ length: 12 }, (_) => 0);
  if (!!data?.totalYearSaleByMonth?.length) {
    salesByYear = data.totalYearSaleByMonth.map((item: any) =>
      item.total.toFixed(2),
    );
  }

  const monthCategories = useMemo(
    () => [
      t('common:january'),
      t('common:february'),
      t('common:march'),
      t('common:april'),
      t('common:may'),
      t('common:june'),
      t('common:july'),
      t('common:august'),
      t('common:september'),
      t('common:october'),
      t('common:november'),
      t('common:december'),
    ],
    [t],
  );

  const sparkline = useMemo(
    () =>
      salesByYear.map((value, index) => ({
        label: monthCategories[index]?.slice(0, 3) ?? '',
        value: Number(value) || 0,
      })),
    [monthCategories, salesByYear],
  );

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  if (
    loading ||
    orderLoading ||
    popularProductLoading ||
    withdrawLoading ||
    topRatedProductsLoading
  ) {
    return <Loader text={t('common:text-loading')} />;
  }
  if (orderError || popularProductError || topRatedProductsError) {
    return (
      <ErrorMessage
        message={
          orderError?.message ||
          popularProductError?.message ||
          topRatedProductsError?.message
        }
      />
    );
  }

  return (
    <DashboardShell variant="admin">
      <DashboardHeader variant="admin" />

      <DashboardKpiBento
        variant="admin"
        totalRevenue={total_revenue}
        sparkline={sparkline}
        totalOrders={data?.totalOrders}
        totalVendors={data?.totalVendors}
        totalShops={data?.totalShops}
      />

      <OrderStatusSection
        analyticsData={data}
        allowedStatus={['pending', 'processing', 'complete', 'cancel']}
      />

      <WidgetGrid>
        <WidgetGridItem span={8}>
          <DashboardSection
            title={t('common:sale-history')}
            contentClassName="!p-0 !pt-0 md:!px-2 md:!pb-2"
          >
            <ColumnChart
              hideHeader
              colors={['hsl(357,73%,48%)']}
              series={salesByYear}
              categories={[
                t('common:january'),
                t('common:february'),
                t('common:march'),
                t('common:april'),
                t('common:may'),
                t('common:june'),
                t('common:july'),
                t('common:august'),
                t('common:september'),
                t('common:october'),
                t('common:november'),
                t('common:december'),
              ]}
            />
          </DashboardSection>
        </WidgetGridItem>

        <WidgetGridItem span={4}>
          <PopularProductList
            products={popularProductData}
            title={t('table:popular-products-table-title')}
            className="h-full"
          />
        </WidgetGridItem>

        <WidgetGridItem span={12}>
          <RecentOrders
            orders={orderData}
            paginatorInfo={orderPaginatorInfo}
            title={t('table:recent-order-table-title')}
            onPagination={handlePagination}
            searchElement={
              <Search
                onSearch={handleSearch}
                placeholderText={t('form:input-placeholder-search-name')}
                className="hidden max-w-sm sm:inline-block [&button]:top-0.5"
                inputClassName="!h-10"
              />
            }
          />
        </WidgetGridItem>

        <WidgetGridItem span={6}>
          <LowStockProduct
            //@ts-ignore
            products={lowStockProduct}
            title={'text-low-stock-products'}
            paginatorInfo={withdrawPaginatorInfo}
            onPagination={handlePagination}
            searchElement={
              <Search
                onSearch={handleSearch}
                placeholderText={t('form:input-placeholder-search-name')}
                className="hidden max-w-sm sm:inline-block"
                inputClassName="!h-10"
              />
            }
          />
        </WidgetGridItem>

        <WidgetGridItem span={6}>
          <TopRatedProducts
            products={topRatedProducts}
            title={'text-most-rated-products'}
            className="h-full"
          />
        </WidgetGridItem>

        <WidgetGridItem span={7}>
          <ProductCountByCategory
            products={productByCategory}
            title={'text-most-category-products'}
          />
        </WidgetGridItem>

        <WidgetGridItem span={5}>
          <WithdrawTable
            withdraws={withdraws}
            title={t('table:withdraw-table-title')}
            paginatorInfo={withdrawPaginatorInfo}
            onPagination={handlePagination}
          />
        </WidgetGridItem>
      </WidgetGrid>
    </DashboardShell>
  );
}
