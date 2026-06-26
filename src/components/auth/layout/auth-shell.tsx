import AuthBrandPanel, {
  type AuthBrandVariant,
} from '@/components/auth/layout/auth-brand-panel';
import AuthFormPanel from '@/components/auth/layout/auth-form-panel';
import Logo from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { useTranslation } from 'next-i18next';

type AuthShellProps = {
  children: React.ReactNode;
  variant?: AuthBrandVariant;
  formWidth?: 'md' | 'lg';
  className?: string;
};

const AuthShell = ({
  children,
  variant = 'admin',
  formWidth = 'md',
  className,
}: AuthShellProps) => {
  const { t } = useTranslation('common');

  const mobileTagline =
    variant === 'vendor'
      ? t('auth-brand-vendor-headline') || 'Sell smarter, grow faster'
      : t('auth-brand-admin-headline') || 'Manage your marketplace';

  return (
    <div className={cn('flex min-h-screen flex-col bg-background lg:flex-row', className)}>
      <div className="border-b border-border/60 bg-muted/30 px-5 py-5 text-center lg:hidden">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-2 text-sm text-body">{mobileTagline}</p>
      </div>

      <AuthBrandPanel variant={variant} />
      <AuthFormPanel formWidth={formWidth}>{children}</AuthFormPanel>
    </div>
  );
};

export default AuthShell;
