import { Card as ShadCard } from '@/components/ui/shadcn/card';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  [key: string]: unknown;
};

const Card: React.FC<Props> = ({ className, children, ...props }) => {
  return (
    <ShadCard
      className={cn(
        'border border-border/60 bg-card p-5 shadow-sm md:p-8',
        className,
      )}
      {...props}
    >
      {children}
    </ShadCard>
  );
};

export default Card;
