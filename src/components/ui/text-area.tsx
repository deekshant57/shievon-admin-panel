import TooltipLabel from '@/components/ui/tooltip-label';
import { Textarea as ShadTextarea } from '@/components/ui/shadcn/textarea';
import { cn } from '@/lib/utils';
import React, { TextareaHTMLAttributes } from 'react';

export interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  inputClassName?: string;
  toolTipText?: string;
  label?: string;
  name: string;
  error?: string;
  shadow?: boolean;
  variant?: 'normal' | 'solid' | 'outline';
  disabled?: boolean;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, Props>((props, ref) => {
  const {
    className,
    label,
    toolTipText,
    name,
    error,
    variant = 'normal',
    shadow = false,
    inputClassName,
    disabled,
    required,
    ...rest
  } = props;

  return (
    <div className={cn(className)}>
      {label ? (
        <TooltipLabel
          htmlFor={name}
          toolTipText={toolTipText}
          label={label}
          required={required}
        />
      ) : null}
      <ShadTextarea
        id={name}
        name={name}
        className={cn(
          'ui-control min-h-[6rem] resize-y py-3',
          shadow && 'focus-visible:shadow-sm',
          disabled && 'ui-field-disabled',
          inputClassName,
        )}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        rows={4}
        ref={ref}
        disabled={disabled}
        {...rest}
      />
      {error ? (
        <p className="my-2 text-xs text-red-500 ltr:text-left rtl:text-right">
          {error}
        </p>
      ) : null}
    </div>
  );
});

TextArea.displayName = 'TextArea';

export default TextArea;
