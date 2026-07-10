import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/utils';

type SectionProps = {
  title?: string;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

const Section = ({
  title,
  description,
  children,
  className,
  contentClassName,
}: SectionProps) => {
  return (
    <Card className={cn('border-border/60 shadow-sm', className)}>
      {title || description ? (
        <CardHeader className="border-b border-border/60 pb-4">
          {title ? (
            <CardTitle className="text-lg font-bold text-heading">
              {title}
            </CardTitle>
          ) : null}
          {description ? (
            <CardDescription className="text-sm text-body">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn('pt-6', contentClassName)}>{children}</CardContent>
    </Card>
  );
};

export default Section;
