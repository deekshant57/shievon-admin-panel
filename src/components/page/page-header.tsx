import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
  /** `stacked` places toolbar on its own full-width row below the title (better for search + filters). */
  toolbarLayout?: 'inline' | 'stacked';
};

const PageHeader = ({
  title,
  subtitle,
  className,
  children,
  toolbarLayout = 'inline',
}: PageHeaderProps) => {
  if (toolbarLayout === 'stacked') {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {children ? <div className="w-full min-w-0">{children}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children ? (
        <div className="w-full min-w-0 sm:max-w-none sm:flex-1">{children}</div>
      ) : null}
    </div>
  );
};

export default PageHeader;
