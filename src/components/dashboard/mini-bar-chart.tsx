import { cn } from '@/lib/utils';

type MiniBarChartProps = {
  data: { label: string; value: number }[];
  className?: string;
  barClassName?: string;
};

const MiniBarChart = ({ data, className, barClassName }: MiniBarChartProps) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn('flex h-32 items-end gap-1.5 sm:gap-2', className)}>
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div
            className={cn(
              'w-full rounded-t-md bg-primary/80 transition-all',
              barClassName,
            )}
            style={{ height: `${(item.value / max) * 100}%`, minHeight: '8px' }}
          />
          <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MiniBarChart;
