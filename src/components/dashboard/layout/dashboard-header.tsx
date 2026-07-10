import PageHeader from '@/components/page/page-header';
import LinkButton from '@/components/ui/link-button';
import { Routes } from '@/config/routes';
import { useMeQuery } from '@/data/user';
import { cn } from '@/lib/utils';
import { useTranslation } from 'next-i18next';

export type DashboardVariant = 'admin' | 'vendor';

type DashboardHeaderProps = {
  variant?: DashboardVariant;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hideActions?: boolean;
  className?: string;
};

const DashboardHeader = ({
  variant = 'admin',
  title,
  subtitle,
  actions,
  hideActions = false,
  className,
}: DashboardHeaderProps) => {
  const { t } = useTranslation('common');
  const { data: user } = useMeQuery();

  const resolvedTitle =
    title ??
    (user?.name
      ? t('dashboard-greeting', { name: user.name }) || `Welcome back, ${user.name}`
      : t('dashboard-title') || 'Dashboard');

  const resolvedSubtitle =
    subtitle ??
    (variant === 'vendor'
      ? t('dashboard-subtitle-vendor') ||
        'Your shop performance at a glance'
      : t('dashboard-subtitle-admin') ||
        "Here's what's happening across your marketplace today");

  const defaultActions =
    variant === 'admin' ? (
      <>
        <LinkButton href={Routes.order.list} size="small" variant="outline">
          {t('dashboard-action-orders') || 'View orders'}
        </LinkButton>
        <LinkButton href={Routes.shop.list} size="small" variant="outline">
          {t('dashboard-action-shops') || 'View shops'}
        </LinkButton>
      </>
    ) : (
      <LinkButton href={Routes.adminMyShops} size="small" variant="outline">
        {t('dashboard-action-my-shops') || 'My shops'}
      </LinkButton>
    );

  const headerActions = hideActions
    ? null
    : actions !== undefined
      ? actions
      : defaultActions;

  return (
    <PageHeader
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      className={cn('mb-0', className)}
    >
      {headerActions}
    </PageHeader>
  );
};

export default DashboardHeader;
