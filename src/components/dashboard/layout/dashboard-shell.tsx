import { cn } from '@/lib/utils';

type DashboardShellProps = {
  children: React.ReactNode;
  variant?: 'admin' | 'vendor';
  className?: string;
};

const DashboardShell = ({
  children,
  className,
}: DashboardShellProps) => {
  return (
    <div className={cn('space-y-6 md:space-y-8', className)}>{children}</div>
  );
};

export default DashboardShell;
