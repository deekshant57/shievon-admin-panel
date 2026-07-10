import { IosArrowDown } from '@/components/icons/ios-arrow-down';
import { IosArrowUp } from '@/components/icons/ios-arrow-up';
import { cn } from '@/lib/utils';

export type StatMetricProps = {
  label: string;
  value?: string | number;
  icon?: React.ReactNode;
  indicator?: 'up' | 'down';
  indicatorText?: string;
  note?: string;
  link?: string;
  linkText?: string;
  className?: string;
  variant?: 'strip' | 'card';
};

const StatMetric = ({
  label,
  value,
  icon,
  indicator,
  indicatorText,
  note,
  link,
  linkText,
  className,
  variant = 'strip',
}: StatMetricProps) => {
  return (
    <div
      className={cn(
        'flex h-full flex-col justify-center px-5 py-4',
        variant === 'strip' &&
          'border-b border-border/60 last:border-b-0 sm:border-b-0 sm:border-e sm:last:border-e-0',
        variant === 'card' &&
          'rounded-lg border border-border/60 bg-card p-5 md:p-6',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tracking-tight text-heading">
            {value ?? '—'}
          </p>
          <p className="mt-1 text-sm text-body">{label}</p>
        </div>
      </div>

      {indicator === 'up' && indicatorText ? (
        <span className="mt-3 inline-flex items-center text-sm font-medium text-green-600">
          <IosArrowUp width="9px" height="11px" className="me-1" />
          {indicatorText}
          {note ? <span className="ms-1 font-normal text-body">{note}</span> : null}
        </span>
      ) : null}
      {indicator === 'down' && indicatorText ? (
        <span className="mt-3 inline-flex items-center text-sm font-medium text-red-500">
          <IosArrowDown width="9px" height="11px" className="me-1" />
          {indicatorText}
          {note ? <span className="ms-1 font-normal text-body">{note}</span> : null}
        </span>
      ) : null}
      {link && linkText ? (
        <a
          className="mt-3 text-xs font-semibold text-accent hover:text-accent-hover"
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          {linkText}
        </a>
      ) : null}
    </div>
  );
};

export default StatMetric;
