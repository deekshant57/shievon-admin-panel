import AppShell from '@/components/layouts/app-shell';
import SideBarMenu from '@/components/layouts/owner/menu';
import OwnerInformation from '@/components/user/user-details';
import { adminOnly, getAuthCredentials, hasAccess } from '@/utils/auth-utils';

const OwnerLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { permissions } = getAuthCredentials();
  const permission = hasAccess(adminOnly, permissions);

  const sidebar = (
    <>
      <OwnerInformation />
      {!permission ? <SideBarMenu /> : null}
    </>
  );

  return (
    <AppShell
      sidebar={sidebar}
      mobileSidebar={sidebar}
      scrollbarOptions={{
        overflow: {
          x: 'hidden',
        },
      }}
    >
      {children}
    </AppShell>
  );
};

export default OwnerLayout;
