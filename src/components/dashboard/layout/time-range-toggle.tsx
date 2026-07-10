import Button from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TimeRangeOption = {
  label: string;
  value: number;
};

type TimeRangeToggleProps = {
  value: number;
  onChange: (value: number) => void;
  options: TimeRangeOption[];
  className?: string;
};

const TimeRangeToggle = ({
  value,
  onChange,
  options,
  className,
}: TimeRangeToggleProps) => {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap rounded-full bg-muted/80 p-1',
        className,
      )}
      role="tablist"
      aria-label="Time range"
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant="custom"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 !h-8 rounded-full !px-3 text-sm font-medium transition-colors duration-200',
              isActive
                ? 'bg-background text-accent shadow-sm'
                : 'text-body hover:text-heading',
            )}
            role="tab"
            aria-selected={isActive}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};

export default TimeRangeToggle;
