import StatMetric from '@/components/page/stat-metric';
import { cn } from '@/lib/utils';

type StatStripProps = {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4 | 5 | 6;
};

const columnClasses = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 xl:grid-cols-4',
  5: 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5',
  6: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
};

const StatStrip = ({ children, className, columns = 4 }: StatStripProps) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 overflow-hidden rounded-lg border border-border/60 bg-card',
        columnClasses[columns],
        className,
      )}
    >
      {children}
    </div>
  );
};

export default StatStrip;
