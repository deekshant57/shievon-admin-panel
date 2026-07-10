import AppShell from '@/components/layouts/app-shell';
import SidebarItem from '@/components/layouts/navigation/sidebar-item';
import { siteSettings } from '@/settings/site.settings';
import { useSettingsQuery } from '@/data/settings';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';
import { miniSidebarInitialValue, RESPONSIVE_WIDTH } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useWindowSize } from '@/utils/use-window-size';

interface MenuItemsProps {
  [key: string]: {
    href: string;
    label: string;
    icon: string;
    permissions?: string[];
    childMenu: {
      href: string | any;
      label: string;
      icon: string;
      permissions?: string[];
    }[];
  };
}

const SidebarItemMap = ({ menuItems }: any) => {
  const { locale } = useRouter();
  const { t } = useTranslation();
  const { settings } = useSettingsQuery({
    language: locale!,
  });
  const { childMenu } = menuItems;

  const isEnableTermsRoute = settings?.options?.enableTerms;
  const isEnableCouponsRoute = settings?.options?.enableCoupons;
  const { permissions: currentUserPermissions } = getAuthCredentials();
  const [miniSidebar] = useAtom(miniSidebarInitialValue);
  const { width } = useWindowSize();
  const {
    query: { shop },
  } = useRouter();

  let termsAndConditions;
  let coupons;

  if (!isEnableTermsRoute) {
    termsAndConditions = menuItems?.childMenu.find(
      (item: any) => item.label === 'Terms And Conditions',
    );
    if (termsAndConditions) termsAndConditions.permissions = adminOnly;
  }

  if (!isEnableCouponsRoute) {
    coupons = menuItems?.childMenu.find(
      (item: any) => item.label === 'Coupons',
    );
    if (coupons) coupons.permissions = adminOnly;
  }

  return (
    <div className="space-y-1">
      {childMenu?.map(
        ({
          href,
          label,
          icon,
          permissions,
          childMenu,
        }: {
          href: string;
          label: string;
          icon: string;
          childMenu: any;
          permissions: any;
        }) => {
          if (!childMenu && !hasAccess(permissions, currentUserPermissions)) {
            return null;
          }

          return (
            <SidebarItem
              key={label}
              // @ts-ignore
              href={href(shop?.toString()!)}
              label={t(label)}
              icon={icon}
              childMenu={childMenu}
              miniSidebar={miniSidebar && width >= RESPONSIVE_WIDTH}
            />
          );
        },
      )}
    </div>
  );
};

const SideBarGroup = () => {
  const [miniSidebar] = useAtom(miniSidebarInitialValue);
  const { role } = getAuthCredentials();
  const menuItems: MenuItemsProps =
    role === 'staff'
      ? siteSettings?.sidebarLinks?.staff
      : siteSettings?.sidebarLinks?.shop;
  const menuKeys = Object.keys(menuItems);
  const { width } = useWindowSize();
  const { t } = useTranslation();

  return (
    <>
      {menuKeys?.map((menu, index) => (
        <div
          className={cn(
            'flex flex-col px-4',
            miniSidebar && width >= RESPONSIVE_WIDTH
              ? 'border-b border-border/60 py-4'
              : 'pb-3 pt-5',
          )}
          key={index}
        >
          <div
            className={cn(
              'px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground',
              miniSidebar && width >= RESPONSIVE_WIDTH ? 'hidden' : '',
            )}
          >
            {t(menuItems[menu]?.label)}
          </div>
          <SidebarItemMap menuItems={menuItems[menu]} />
        </div>
      ))}
    </>
  );
};

const ShopLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <AppShell sidebar={<SideBarGroup />} variant="shop">
      {children}
    </AppShell>
  );
};

export default ShopLayout;
