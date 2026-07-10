import Footer from '@/components/layouts/footer/footer-bar';
import Navbar from '@/components/layouts/navigation/top-navbar';
import MobileNavigation from '@/components/layouts/navigation/mobile-navigation';
import Scrollbar from '@/components/ui/scrollbar';
import {
  checkIsMaintenanceModeComing,
  checkIsMaintenanceModeStart,
  miniSidebarInitialValue,
  RESPONSIVE_WIDTH,
} from '@/utils/constants';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useWindowSize } from '@/utils/use-window-size';

type AppShellVariant = 'admin' | 'shop';

type AppShellProps = {
  children?: React.ReactNode;
  sidebar: React.ReactNode;
  mobileSidebar?: React.ReactNode;
  variant?: AppShellVariant;
  scrollbarOptions?: Record<string, unknown>;
};

function getAsidePadding(
  variant: AppShellVariant,
  width: number,
  underMaintenance: boolean,
  underMaintenanceStart: boolean,
) {
  const isMaintenance =
    width >= RESPONSIVE_WIDTH && (underMaintenance || underMaintenanceStart);

  if (variant === 'shop') {
    return isMaintenance ? 'pt-[8.75rem]' : 'pt-20';
  }

  return isMaintenance ? 'lg:pt-[8.75rem]' : 'pt-20';
}

function getMainPadding(
  variant: AppShellVariant,
  width: number,
  underMaintenance: boolean,
  underMaintenanceStart: boolean,
  miniSidebar: boolean,
) {
  const isMaintenance =
    width >= RESPONSIVE_WIDTH && (underMaintenance || underMaintenanceStart);

  const topPadding =
    variant === 'shop'
      ? isMaintenance
        ? 'lg:pt-[8.0625rem]'
        : 'pt-[3.9375rem] lg:pt-[4.75rem]'
      : isMaintenance
        ? 'lg:pt-[8.75rem]'
        : 'pt-[72px] lg:pt-20';

  const sidePadding =
    variant === 'shop'
      ? miniSidebar && width >= RESPONSIVE_WIDTH
        ? 'ltr:pl-24 rtl:pr-24'
        : 'ltr:xl:pl-76 rtl:xl:pr-76 ltr:lg:pl-72 rtl:lg:pr-72 rtl:lg:pl-0'
      : miniSidebar && width >= RESPONSIVE_WIDTH
        ? 'ltr:lg:pl-24 rtl:lg:pr-24'
        : 'ltr:xl:pl-76 rtl:xl:pr-76 ltr:lg:pl-72 rtl:lg:pr-72 rtl:lg:pl-0';

  return cn(topPadding, sidePadding);
}

const AppShell: React.FC<AppShellProps> = ({
  children,
  sidebar,
  mobileSidebar,
  variant = 'admin',
  scrollbarOptions,
}) => {
  const { locale } = useRouter();
  const dir = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr';
  const [miniSidebar] = useAtom(miniSidebarInitialValue);
  const [underMaintenance] = useAtom(checkIsMaintenanceModeComing);
  const [underMaintenanceStart] = useAtom(checkIsMaintenanceModeStart);
  const { width } = useWindowSize();

  return (
    <div
      className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background transition-colors duration-150"
      dir={dir}
    >
      <Navbar />
      <MobileNavigation>{mobileSidebar ?? sidebar}</MobileNavigation>

      <div className="flex min-w-0 flex-1">
        <aside
          className={cn(
            'fixed bottom-0 z-10 hidden h-full w-72 border-r border-border/60 bg-card transition-[width] duration-200 ltr:left-0 ltr:right-auto rtl:right-0 rtl:left-auto lg:block',
            getAsidePadding(
              variant,
              width,
              underMaintenance,
              underMaintenanceStart,
            ),
            miniSidebar && width >= RESPONSIVE_WIDTH ? 'lg:w-24' : 'lg:w-72',
          )}
        >
          <div className="sidebar-scrollbar h-full w-full overflow-x-hidden">
            <Scrollbar
              className="h-full w-full"
              options={{
                scrollbars: {
                  autoHide: 'never',
                },
                ...scrollbarOptions,
              }}
            >
              {sidebar}
            </Scrollbar>
          </div>
        </aside>

        <main
          className={cn(
            'relative flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden transition-[padding] duration-200',
            getMainPadding(
              variant,
              width,
              underMaintenance,
              underMaintenanceStart,
              miniSidebar,
            ),
          )}
        >
          <div className="h-full min-w-0 max-w-full p-5 md:p-8">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
