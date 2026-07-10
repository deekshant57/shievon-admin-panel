import Logo from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export type AuthBrandVariant = 'admin' | 'vendor';

type AuthBrandPanelProps = {
  variant?: AuthBrandVariant;
  className?: string;
};

const AuthBrandPanel = ({
  variant = 'admin',
  className,
}: AuthBrandPanelProps) => {
  const { t } = useTranslation('common');

  const isVendor = variant === 'vendor';

  const headline = isVendor
    ? t('auth-brand-vendor-headline') || 'Sell smarter, grow faster'
    : t('auth-brand-admin-headline') || 'Manage your marketplace';

  const subtitle = isVendor
    ? t('auth-brand-vendor-subtitle') ||
      'List products, manage orders, and track payouts from one dashboard.'
    : t('auth-brand-admin-subtitle') ||
      'Everything you need to run orders, vendors, and growth in one place.';

  const bullets = isVendor
    ? [
        t('auth-brand-vendor-bullet-catalog') || 'Product catalog',
        t('auth-brand-vendor-bullet-orders') || 'Order management',
        t('auth-brand-vendor-bullet-payouts') || 'Withdrawals & payouts',
      ]
    : [
        t('auth-brand-admin-bullet-orders') || 'Orders & fulfillment',
        t('auth-brand-admin-bullet-vendors') || 'Vendor management',
        t('auth-brand-admin-bullet-analytics') || 'Real-time analytics',
      ];

  return (
    <aside
      className={cn(
        'auth-brand-panel relative hidden flex-col justify-between overflow-hidden border-e border-border/60 p-10 xl:p-14 lg:flex lg:w-[45%] xl:w-[42%]',
        className,
      )}
    >
      <div className="relative z-10">
        <Logo />
        <h2 className="mt-10 max-w-md text-3xl font-bold tracking-tight text-heading xl:text-4xl">
          {headline}
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-body">
          {subtitle}
        </p>
        <ul className="mt-8 space-y-4">
          {bullets.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-heading">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default AuthBrandPanel;
