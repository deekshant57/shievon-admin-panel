import TooltipLabel from '@/components/ui/tooltip-label';
import { Input as ShadInput } from '@/components/ui/shadcn/input';
import { cn } from '@/lib/utils';
import React, { InputHTMLAttributes } from 'react';

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  label?: string;
  toolTipText?: string;
  note?: string;
  name: string;
  error?: string;
  type?: string;
  shadow?: boolean;
  variant?: 'normal' | 'solid' | 'outline';
  dimension?: 'small' | 'medium' | 'big';
  showLabel?: boolean;
  required?: boolean;
}

const sizeClasses = {
  small: 'h-10 text-sm',
  medium: 'h-12',
  big: 'h-14',
};

const Input = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      className,
      label,
      note,
      name,
      error,
      children,
      variant = 'normal',
      dimension = 'medium',
      shadow = false,
      type = 'text',
      inputClassName,
      disabled,
      showLabel = true,
      required,
      toolTipText,
      labelClassName,
      ...rest
    },
    ref,
  ) => {
    const numberDisable = type === 'number' && disabled ? 'number-disable' : '';

    return (
      <div className={cn(className)}>
        {showLabel || label ? (
          <TooltipLabel
            htmlFor={name}
            toolTipText={toolTipText}
            label={label}
            required={required}
            className={labelClassName}
          />
        ) : null}
        <ShadInput
          id={name}
          name={name}
          type={type}
          ref={ref}
          className={cn(
            'rounded-md border-border-base bg-background text-sm text-heading transition-colors duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/30',
            sizeClasses[dimension],
            variant === 'outline' && 'bg-background',
            (variant === 'normal' || variant === 'solid') && 'bg-background',
            shadow && 'focus-visible:shadow-sm',
            disabled &&
              `cursor-not-allowed border-[#D4D8DD] bg-[#EEF1F4] ${numberDisable} select-none`,
            inputClassName,
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          {...rest}
        />
        {note && <p className="mt-2 text-xs text-body">{note}</p>}
        {error && (
          <p className="my-2 text-start text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
