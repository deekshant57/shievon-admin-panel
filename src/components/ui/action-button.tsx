import {
  actionButtonVariants,
  type ActionButtonSize,
  type ActionButtonVariant,
} from '@/components/ui/action-button-variants';
import { cn } from '@/lib/utils';
import React, { ButtonHTMLAttributes } from 'react';

export interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  loading?: boolean;
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      type,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        disabled={disabled || loading}
        className={cn(
          actionButtonVariants({ variant, size }),
          (disabled || loading) && 'cursor-not-allowed opacity-50',
          className,
        )}
        {...props}
      >
        {children}
        {loading ? (
          <span
            className="ms-1 h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent border-t-current"
            aria-hidden
          />
        ) : null}
      </button>
    );
  },
);

ActionButton.displayName = 'ActionButton';

export default ActionButton;
