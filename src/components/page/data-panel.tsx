import PageHeader from '@/components/page/page-header';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/utils';

type DataPanelProps = {
  title?: string;
  subtitle?: string;
  toolbar?: React.ReactNode;
  filters?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

const DataPanel = ({
  title,
  subtitle,
  toolbar,
  filters,
  footer,
  children,
  className,
}: DataPanelProps) => {
  return (
    <Card className={cn('mb-8 border-border/60 shadow-sm', className)}>
      {title || toolbar ? (
        <div className="border-b border-border/60 px-5 py-5 md:px-8 md:py-6">
          <PageHeader title={title ?? ''} subtitle={subtitle}>
            {toolbar}
          </PageHeader>
          {filters ? <div className="mt-5 border-t border-border/60 pt-5">{filters}</div> : null}
        </div>
      ) : null}
      <CardContent className="px-5 py-5 md:px-8 md:py-6">{children}</CardContent>
      {footer ? (
        <CardFooter className="border-t border-border/60 px-5 py-4 md:px-8">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
};

export default DataPanel;
