import { Eye } from '@/components/icons/eye-icon';
import { EyeOff } from '@/components/icons/eye-off-icon';
import { Input as ShadInput } from '@/components/ui/shadcn/input';
import Link from './link';
import { cn } from '@/lib/utils';
import React, { InputHTMLAttributes, useState } from 'react';

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  inputClassName?: string;
  forgotPassHelpText?: string;
  label: string;
  name: string;
  forgotPageLink?: string;
  shadow?: boolean;
  variant?: 'normal' | 'solid' | 'outline';
  error: string | undefined;
  required?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      className,
      inputClassName,
      forgotPassHelpText,
      label,
      name,
      error,
      children,
      variant = 'normal',
      shadow = false,
      forgotPageLink = '',
      required,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const [show, setShow] = useState(false);

    return (
      <div className={className}>
        <div className="mb-3 flex items-center justify-between">
          <label
            htmlFor={name}
            className="text-sm font-semibold leading-none text-body-dark"
          >
            {label}
            {required ? <span className="ms-0.5 text-red-500">*</span> : null}
          </label>

          {forgotPageLink && forgotPassHelpText ? (
            <Link
              href={forgotPageLink}
              className="text-xs text-accent transition-colors duration-200 hover:text-accent-hover focus:font-semibold focus:text-accent-700 focus:outline-none"
            >
              {forgotPassHelpText}
            </Link>
          ) : null}
        </div>
        <div className="relative">
          <ShadInput
            id={name}
            name={name}
            type={show ? 'text' : 'password'}
            ref={ref}
            disabled={disabled}
            className={cn(
              'ui-control h-12 ltr:pl-4 ltr:pr-12 rtl:pl-12 rtl:pr-4',
              shadow && 'focus-visible:shadow-sm',
              disabled && 'ui-field-disabled',
              inputClassName,
            )}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            {...rest}
          />
          <button
            type="button"
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 -translate-y-1/2 text-body transition-colors duration-200 hover:text-accent end-4"
            onClick={() => setShow((prev) => !prev)}
          >
            {show ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {error ? (
          <p className="my-2 text-start text-xs text-red-500">{error}</p>
        ) : null}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
