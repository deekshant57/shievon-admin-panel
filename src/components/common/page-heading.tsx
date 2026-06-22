import { cn } from '@/lib/utils';

const PageHeading = ({
  title,
  className,
  ...props
}: {
  title: string;
  className?: string;
}) => {
  return (
    <h1
      className={cn(
        'text-xl font-bold tracking-tight text-foreground',
        className,
      )}
      {...props}
    >
      {title}
    </h1>
  );
};

export default PageHeading;
