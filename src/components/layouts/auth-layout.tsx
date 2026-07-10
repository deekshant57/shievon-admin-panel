import { AuthShell } from '@/components/auth/layout';
import type { AuthBrandVariant } from '@/components/auth/layout';

type AuthPageLayoutProps = {
  children: React.ReactNode;
  variant?: AuthBrandVariant;
  formWidth?: 'md' | 'lg';
};

export default function AuthPageLayout({
  children,
  variant = 'admin',
  formWidth = 'md',
}: AuthPageLayoutProps) {
  return (
    <AuthShell variant={variant} formWidth={formWidth}>
      {children}
    </AuthShell>
  );
}
