import {
  actionButtonVariants,
  mapLegacyActionSize,
  mapLegacyActionVariant,
  type ActionButtonSize,
  type ActionButtonVariant,
} from '@/components/ui/action-button-variants';
import { cn } from '@/lib/utils';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';

export interface LinkActionButtonProps {
  className?: string;
  variant?: ActionButtonVariant | 'normal' | 'outline';
  size?: ActionButtonSize | 'small' | 'medium' | 'big';
  active?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

const LinkActionButton: React.FC<NextLinkProps & LinkActionButtonProps> = ({
  href,
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...props
}) => {
  const resolvedVariant =
    variant === 'normal' || variant === 'outline'
      ? mapLegacyActionVariant(variant)
      : variant;
  const resolvedSize =
    size === 'small' || size === 'medium' || size === 'big'
      ? mapLegacyActionSize(size)
      : size;

  if (disabled) {
    return (
      <span
        className={cn(
          actionButtonVariants({
            variant: resolvedVariant,
            size: resolvedSize,
          }),
          'cursor-not-allowed opacity-50',
          className,
        )}
        aria-disabled
      >
        {children}
      </span>
    );
  }

  return (
    <NextLink
      href={href}
      className={cn(
        actionButtonVariants({ variant: resolvedVariant, size: resolvedSize }),
        className,
      )}
      {...props}
    >
      {children}
    </NextLink>
  );
};

export default LinkActionButton;
