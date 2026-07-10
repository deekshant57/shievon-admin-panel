import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design B · Soft — global toolbar action button styles.
 * primary: tinted emphasis (e.g. "Add new shop")
 * secondary: muted fill (e.g. "Inactive / New shops")
 */
export const actionButtonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 flex-shrink-0 whitespace-nowrap rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
  {
    variants: {
      variant: {
        primary:
          'bg-primary/10 font-semibold text-primary hover:bg-primary/15',
        secondary:
          'bg-muted/70 font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ActionButtonVariant = NonNullable<
  VariantProps<typeof actionButtonVariants>['variant']
>;
export type ActionButtonSize = NonNullable<
  VariantProps<typeof actionButtonVariants>['size']
>;

/** Maps legacy LinkButton / Button size names to action sizes. */
export const mapLegacyActionSize = (
  size?: 'small' | 'medium' | 'big',
): ActionButtonSize => {
  if (size === 'small') return 'sm';
  if (size === 'big') return 'lg';
  return 'md';
};

/** Maps legacy variant names to soft action variants. */
export const mapLegacyActionVariant = (
  variant?: 'normal' | 'outline',
): ActionButtonVariant => {
  return variant === 'outline' ? 'secondary' : 'primary';
};
