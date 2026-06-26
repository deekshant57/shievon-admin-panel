import { getIcon } from '@/utils/get-icon';
import * as productsCardIcon from '@/components/icons/shop-single';
import { cn } from '@/lib/utils';

export type StatTileProps = {
  title: string;
  content?: string;
  icon?: React.ReactNode;
  iconName?: string;
  className?: string;
  iconClassName?: string;
  iconInnerClassName?: string;
};

const StatTile = ({
  title,
  content,
  icon,
  iconName,
  className,
  iconClassName,
  iconInnerClassName,
}: StatTileProps) => {
  const resolvedIcon =
    icon ??
    (iconName
      ? getIcon({
          iconList: productsCardIcon,
          iconName,
          className: 'h-5 w-5',
        })
      : null);

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-4 md:px-5 md:py-5',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {content ? (
          <p className="text-xl font-bold tracking-tight text-heading md:text-2xl">
            {content}
          </p>
        ) : null}
        {title ? (
          <p className="mt-1 truncate text-sm text-body">{title}</p>
        ) : null}
      </div>
      {resolvedIcon ? (
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-accent',
            iconClassName,
          )}
        >
          <div
            className={cn(
              'flex h-full w-full items-center justify-center',
              iconInnerClassName,
            )}
          >
            {resolvedIcon}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StatTile;
