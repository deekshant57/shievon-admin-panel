import PageHeader from '@/components/page/page-header';
import {
  Card,
  CardContent,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/utils';

type DashboardSectionProps = {
  title?: string;
  subtitle?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

const DashboardSection = ({
  title,
  subtitle,
  toolbar,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) => {
  return (
    <Card className={cn('border-border/60 shadow-sm', className)}>
      {title || subtitle || toolbar ? (
        <div className="border-b border-border/60 px-5 py-5 md:px-7 md:py-6">
          <PageHeader title={title ?? ''} subtitle={subtitle}>
            {toolbar}
          </PageHeader>
        </div>
      ) : null}
      <CardContent className={cn('p-5 md:p-7', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
};

export default DashboardSection;
