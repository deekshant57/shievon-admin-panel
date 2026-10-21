import AttributeList from '@/components/attribute/attribute-list';
import AttributesSummaryStrip from '@/components/attribute/attributes-summary-strip';
import ErrorMessage from '@/components/ui/error-message';
import LinkActionButton from '@/components/ui/link-action-button';
import ActionButton from '@/components/ui/action-button';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ShopLayout from '@/components/layouts/shop';
import { DashboardShell } from '@/components/dashboard/layout';
import DataPanel from '@/components/page/data-panel';
import { useRouter } from 'next/router';
import {
  adminOnly,
  adminOwnerAndStaffOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { useShopQuery } from '@/data/shop';
import { useState, useEffect, useRef } from 'react';
import { SortOrder } from '@/types';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { MoreIcon } from '@/components/icons/more-icon';
import { useAttributesQuery } from '@/data/attributes';
import { useMeQuery } from '@/data/user';
import { Routes } from '@/config/routes';

export default function AttributePage() {
  const router = useRouter();
  const {
    query: { shop },
    locale,
  } = useRouter();
  const { permissions } = getAuthCredentials();
  const { t } = useTranslation();
  const { openModal } = useModalAction();
  const [orderBy, setOrder] = useState('updated_at');
  const [sortedBy, setColumn] = useState<SortOrder>(SortOrder.Desc);
  const { data: me } = useMeQuery();
  const { data: shopData, isLoading: fetchingShop } = useShopQuery({
    slug: shop as string,
  });
  const shopId = shopData?.id!;
  const hasRedirectedRef = useRef(false);

  function handleImportModal() {
    openModal('EXPORT_IMPORT_ATTRIBUTE', shopId);
  }

  const { attributes, loading, error } = useAttributesQuery(
    {
      shop_id: shopId,
      orderBy,
      sortedBy,
      language: locale,
    },
    {
      enabled: Boolean(shopId),
    }
  );

  // Check permissions and redirect if user doesn't have access
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Wait for both shop and user data to be loaded before checking permissions
    if (fetchingShop || !shopId || !me) {
      return;
    }

    // Check if user has required permission
    const hasRequiredPermission = hasAccess(adminOnly, permissions);
    // Check if user owns this shop
    const isShopOwner = me?.shops?.map((shop) => shop.id).includes(shopId) ?? false;
    // Check if user manages this shop
    const isManagedShop = me?.managed_shop?.id === shopId;

    // Only redirect if user doesn't have any of the required access
    if (!hasRequiredPermission && !isShopOwner && !isManagedShop) {
      hasRedirectedRef.current = true;
      router.replace(Routes.dashboard);
    }
  }, [fetchingShop, shopId, me, permissions, router]);

  if (loading || fetchingShop)
    return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <DashboardShell>
      <AttributesSummaryStrip
        totalAttributes={attributes?.length}
        matchingResults={attributes?.length}
      />

      <DataPanel
        className="mb-0"
        title={t('common:sidebar-nav-item-attributes')}
        toolbarLayout="stacked"
        toolbar={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            <LinkActionButton
              href={`/${shop}/attributes/create`}
              variant="primary"
              size="sm"
              className="col-span-2 w-full justify-center sm:col-span-1 sm:w-auto"
            >
              + {t('form:button-label-add')} {t('common:attribute')}
            </LinkActionButton>
            <ActionButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleImportModal}
              className="col-span-2 w-full justify-center sm:hidden"
            >
              {t('common:text-export-import')}
            </ActionButton>
            <ActionButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleImportModal}
              className="hidden w-auto justify-center sm:inline-flex"
              aria-label={t('common:text-export-import')}
            >
              <MoreIcon className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        }
      >
        <AttributeList
          attributes={attributes}
          onOrder={setOrder}
          onSort={setColumn}
        />
      </DataPanel>
    </DashboardShell>
  );
}
AttributePage.authenticate = {
  permissions: adminOwnerAndStaffOnly,
};
AttributePage.Layout = ShopLayout;
export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});

export async function getStaticPaths() {
  return { paths: [{ params: {"shop":"__gh"} }], fallback: false };
}
