import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
};

const PageHeader = ({
  title,
  subtitle,
  className,
  children,
}: PageHeaderProps) => {
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
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      ) : null}
    </div>
  );
};

export default PageHeader;
