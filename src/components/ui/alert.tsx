import { Alert as ShadAlert, AlertDescription } from '@/components/ui/shadcn/alert';
import { CloseIcon } from '@/components/icons/close-icon';
import { cn } from '@/lib/utils';

type AlertProps = {
  message: string | undefined | null;
  variant?:
    | 'info'
    | 'warning'
    | 'error'
    | 'success'
    | 'infoOutline'
    | 'warningOutline'
    | 'errorOutline'
    | 'successOutline';
  closeable?: boolean;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
  childClassName?: string;
};

const variantClasses = {
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  error: 'border-red-200 bg-red-50 text-red-600',
  success: 'border-green-200 bg-green-50 text-green-700',
  infoOutline: 'border border-blue-200 bg-background text-blue-600',
  warningOutline: 'border border-yellow-200 bg-background text-yellow-600',
  errorOutline: 'border border-red-200 bg-background text-red-600',
  successOutline: 'border border-green-200 bg-background text-green-600',
};

const Alert: React.FC<AlertProps> = ({
  message = '',
  closeable = false,
  variant = 'info',
  className,
  onClose,
  children,
  childClassName,
}) => {
  return (
    <ShadAlert
      className={cn(
        'relative rounded-lg border px-5 py-4 shadow-sm',
        variantClasses[variant],
        className,
      )}
      role="alert"
    >
      <div className={cn(childClassName)}>
        <AlertDescription className="text-sm">{message}</AlertDescription>
        {children}
      </div>
      {closeable && (
        <button
          data-dismiss="alert"
          aria-label="Close"
          onClick={onClose}
          title="Close alert"
          className="absolute end-2 top-1/2 -me-0.5 -mt-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-red-500 transition-colors duration-200 hover:bg-muted focus:bg-muted focus:outline-none"
        >
          <span aria-hidden="true">
            <CloseIcon className="h-3 w-3" />
          </span>
        </button>
      )}
    </ShadAlert>
  );
};

export default Alert;
