import Cart from '@/components/cart/cart';
import CartCounterButton from '@/components/cart/cart-counter-button';
import Search from '@/components/common/search';
import { ArrowDown } from '@/components/icons/arrow-down';
import { ArrowUp } from '@/components/icons/arrow-up';
import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import ProductCard from '@/components/product/card';
import CategoryTypeFilter from '@/components/filters/category-type-filter';
import Drawer from '@/components/ui/drawer';
import DrawerWrapper from '@/components/ui/drawer-wrapper';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import NotFound from '@/components/ui/not-found';
import Pagination from '@/components/ui/pagination';
import { useUI } from '@/contexts/ui.context';
import { useProductsQuery } from '@/data/product';
import { Category, Product, ProductStatus, Type } from '@/types';
import { adminOnly } from '@/utils/auth-utils';
import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function ProductsPage() {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [visible, setVisible] = useState(false);
  const { displayCartSidebar, closeCartSidebar } = useUI();
  const toggleVisible = () => {
    setVisible((v) => !v);
  };
  const { products, loading, paginatorInfo, error } = useProductsQuery({
    limit: 18,
    language: locale,
    status: ProductStatus.Publish,
    name: searchTerm,
    page,
    type,
    categories: category,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  function handleSearch({ searchText }: { searchText: string }) {
    setSearchTerm(searchText);
    setPage(1);
  }

  function handlePagination(current: any) {
    setPage(current);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <DataPanel
        className="mb-0"
        title={t('form:input-label-create-order')}
        subtitle={t('common:create-order-page-subtitle')}
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Search
                onSearch={handleSearch}
                placeholderText={t('form:input-placeholder-search-name')}
                debounceMs={400}
                variant="hybrid"
                size="sm"
                className="w-full min-w-0 sm:flex-1"
              />
              <button
                type="button"
                className="flex shrink-0 items-center justify-center whitespace-nowrap text-sm font-semibold text-accent"
                onClick={toggleVisible}
              >
                {t('common:text-filter')}{' '}
                {visible ? (
                  <ArrowUp className="ms-2" />
                ) : (
                  <ArrowDown className="ms-2" />
                )}
              </button>
            </div>

            <div
              className={cn('w-full transition', {
                'visible h-auto': visible,
                'invisible h-0 overflow-hidden': !visible,
              })}
            >
              <div className="border-t border-border/60 pt-4">
                <CategoryTypeFilter
                  type={type}
                  onCategoryFilter={(selected: Category) => {
                    setCategory(selected?.slug!);
                    setPage(1);
                  }}
                  onTypeFilter={(selected: Type) => {
                    setType(selected?.slug!);
                    setPage(1);
                  }}
                  className="w-full"
                  enableCategory
                  enableType
                />
              </div>
            </div>
          </div>
        }
      >
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-4 3xl:grid-cols-6">
          {products?.map((product: Product) => (
            <ProductCard key={product.id} item={product} />
          ))}
        </div>
        {!products?.length ? (
          <NotFound text="text-not-found" className="mx-auto w-7/12" />
        ) : null}
        <div className="mt-8 flex w-full justify-center">
          {!!paginatorInfo?.total && (
            <div className="flex items-center justify-end">
              <Pagination
                total={paginatorInfo.total}
                current={paginatorInfo.currentPage}
                pageSize={paginatorInfo.perPage}
                onChange={handlePagination}
                showLessItems
              />
            </div>
          )}
        </div>
      </DataPanel>

      <CartCounterButton />
      <Drawer
        open={displayCartSidebar}
        onClose={closeCartSidebar}
        variant="right"
      >
        <DrawerWrapper hideTopBar={true}>
          <Cart />
        </DrawerWrapper>
      </Drawer>
    </div>
  );
}
ProductsPage.authenticate = {
  permissions: adminOnly,
};
ProductsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
