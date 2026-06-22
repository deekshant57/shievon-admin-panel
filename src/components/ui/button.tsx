import React, { ButtonHTMLAttributes } from 'react';
import { Button as ShadButton } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'normal' | 'outline' | 'custom';
  size?: 'big' | 'medium' | 'small';
  active?: boolean;
  loading?: boolean;
  spinnerColor?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const sizeClasses = {
  small: 'h-10 px-3 text-sm',
  medium: 'h-12 px-5 text-sm font-semibold',
  big: 'h-14 px-10 font-semibold',
};

const variantClasses = {
  normal: 'bg-accent text-light shadow hover:bg-accent-hover',
  outline:
    'border-border-400 bg-background text-body shadow-sm hover:border-accent hover:bg-accent hover:text-light',
  custom: 'border-transparent bg-transparent shadow-none',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      className,
      variant = 'normal',
      size = 'medium',
      active,
      children,
      loading = false,
      spinnerColor,
      disabled = false,
      ...rest
    } = props;

    return (
      <ShadButton
        ref={ref}
        type={rest.type ?? 'button'}
        aria-pressed={active}
        data-variant={variant}
        disabled={disabled || loading}
        className={cn(
          'rounded-md font-semibold leading-none transition-colors duration-200',
          sizeClasses[size],
          variantClasses[variant],
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
        {...rest}
      >
        {children}
        {loading && (
          <span
            className="ms-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-2"
            style={{
              borderTopColor:
                spinnerColor ??
                (variant === 'outline' ? 'currentColor' : '#ffffff'),
            }}
          />
        )}
      </ShadButton>
    );
  },
);

Button.displayName = 'Button';

export default Button;
