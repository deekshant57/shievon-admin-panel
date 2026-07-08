import Card from '@/components/common/card';
import cn from 'classnames';

type OrderFulfillmentPanelProps = {
  title: string;
  description?: string;
  toolbar?: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function OrderFulfillmentPanel({
  title,
  description,
  toolbar,
  meta,
  children,
  className,
}: OrderFulfillmentPanelProps) {
  return (
    <Card
      className={cn('mb-6 border border-border-200 p-0 shadow-sm', className)}
    >
      <div className="flex flex-col gap-4 border-b border-border-200 px-5 py-5 sm:flex-row sm:items-start sm:justify-between md:px-8 md:py-6">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-heading">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-body">{description}</p>
          ) : null}
          {meta ? <div className="mt-2">{meta}</div> : null}
        </div>
        {toolbar ? (
          <div className="flex flex-wrap gap-2 sm:shrink-0">{toolbar}</div>
        ) : null}
      </div>
      <div className="px-5 py-5 md:px-8 md:py-6">{children}</div>
    </Card>
  );
}
