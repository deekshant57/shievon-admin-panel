import { cn } from '@/lib/utils';

type WidgetGridSpan = 4 | 5 | 6 | 7 | 8 | 12;

const spanClasses: Record<WidgetGridSpan, string> = {
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12',
};

type WidgetGridProps = {
  children: React.ReactNode;
  className?: string;
};

export const WidgetGrid = ({ children, className }: WidgetGridProps) => {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-12 lg:gap-7', className)}>
      {children}
    </div>
  );
};

type WidgetGridItemProps = {
  children: React.ReactNode;
  span?: WidgetGridSpan;
  className?: string;
};

export const WidgetGridItem = ({
  children,
  span = 12,
  className,
}: WidgetGridItemProps) => {
  return (
    <div className={cn(spanClasses[span], className)}>{children}</div>
  );
};
