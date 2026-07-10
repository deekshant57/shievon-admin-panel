import { cn } from '@/lib/utils';

type DataTableShellProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'bordered' | 'plain';
};

/**
 * Horizontal scroll container for rc-table.
 * Used by `@/components/ui/table` — avoid wrapping Table again in list components.
 */
const DataTableShell = ({
  children,
  className,
  variant = 'bordered',
}: DataTableShellProps) => {
  return (
    <div
      className={cn(
        'data-table-shell w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain [contain:inline-size]',
        variant === 'bordered' &&
          'rounded-lg border border-border/60 bg-card',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default DataTableShell;
