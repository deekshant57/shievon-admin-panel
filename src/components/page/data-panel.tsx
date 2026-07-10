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
  toolbarLayout?: 'inline' | 'stacked';
  filters?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

const DataPanel = ({
  title,
  subtitle,
  toolbar,
  toolbarLayout = 'inline',
  filters,
  footer,
  children,
  className,
}: DataPanelProps) => {
  return (
    <Card
      className={cn(
        'mb-8 w-full min-w-0 max-w-full overflow-hidden border-border/60 shadow-sm',
        className,
      )}
    >
      {title || toolbar ? (
        <div className="min-w-0 max-w-full border-b border-border/60 px-5 py-5 md:px-8 md:py-6">
          <PageHeader
            title={title ?? ''}
            subtitle={subtitle}
            toolbarLayout={toolbarLayout}
          >
            {toolbar}
          </PageHeader>
          {filters ? <div className="mt-5 border-t border-border/60 pt-5">{filters}</div> : null}
        </div>
      ) : null}
      <CardContent className="min-w-0 max-w-full overflow-hidden p-0">
        {/* Table shell is full-bleed; other children (e.g. pagination) keep side padding */}
        <div className="data-panel-body min-w-0 max-w-full">{children}</div>
      </CardContent>
      {footer ? (
        <CardFooter className="border-t border-border/60 px-5 py-4 md:px-8">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
};

export default DataPanel;
