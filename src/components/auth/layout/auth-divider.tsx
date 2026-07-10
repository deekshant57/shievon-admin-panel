import { cn } from '@/lib/utils';
import { useTranslation } from 'next-i18next';

type AuthDividerProps = {
  label?: string;
  className?: string;
};

const AuthDivider = ({ label, className }: AuthDividerProps) => {
  const { t } = useTranslation('common');

  return (
    <div
      className={cn('relative my-8 flex items-center', className)}
      role="separator"
    >
      <div className="grow border-t border-border/60" />
      <span className="mx-4 shrink-0 bg-background px-2 text-sm text-muted-foreground">
        {label ?? t('text-or')}
      </span>
      <div className="grow border-t border-border/60" />
    </div>
  );
};

export default AuthDivider;
