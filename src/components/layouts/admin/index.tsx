import AppShell from '@/components/layouts/app-shell';
import SidebarItem from '@/components/layouts/navigation/sidebar-item';
import { siteSettings } from '@/settings/site.settings';
import { miniSidebarInitialValue, RESPONSIVE_WIDTH } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useWindowSize } from '@/utils/use-window-size';

interface MenuItemsProps {
  [key: string]: {
    href: string;
    label: string;
    icon: string;
    childMenu: {
      href: string;
      label: string;
      icon: string;
    }[];
  };
}

const SidebarItemMap = ({ menuItems }: any) => {
  const { t } = useTranslation();
  const [miniSidebar] = useAtom(miniSidebarInitialValue);
  const { childMenu } = menuItems;
  const { width } = useWindowSize();

  return (
    <div className="space-y-1">
      {childMenu?.map(
        ({
          href,
          label,
          icon,
          childMenu,
        }: {
          href: string;
          label: string;
          icon: string;
          childMenu: any;
        }) => (
          <SidebarItem
            href={href}
            key={label}
            label={t(label)}
            icon={icon}
            childMenu={childMenu}
            miniSidebar={miniSidebar && width >= RESPONSIVE_WIDTH}
          />
        ),
      )}
    </div>
  );
};

const SideBarGroup = () => {
  const { t } = useTranslation();
  const [miniSidebar] = useAtom(miniSidebarInitialValue);
  const menuItems: MenuItemsProps = siteSettings?.sidebarLinks?.admin;
  const menuKeys = Object.keys(menuItems);
  const { width } = useWindowSize();

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

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <AppShell sidebar={<SideBarGroup />}>
      {children}
    </AppShell>
  );
};

export default AdminLayout;
