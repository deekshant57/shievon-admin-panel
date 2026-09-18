import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import StatMetric from '@/components/page/stat-metric';
import StatStrip from '@/components/page/stat-strip';
import SettlementsDeskShopTable from '@/components/withdraw/settlements-desk-shop-table';
import SettlementsDeskWithdrawTable from '@/components/withdraw/settlements-desk-withdraw-table';
import ActionButton from '@/components/ui/action-button';
import ErrorMessage from '@/components/ui/error-message';
import Input from '@/components/ui/input';
import Loader from '@/components/ui/loader/loader';
import LinkActionButton from '@/components/ui/link-action-button';
import { Routes } from '@/config/routes';
import { useSettlementsDeskQuery } from '@/data/settlements-desk';
import { useWithdrawsQuery } from '@/data/withdraw';
import { adminOnly } from '@/utils/auth-utils';
import { cn } from '@/lib/utils';
import usePrice from '@/utils/use-price';
import { WithdrawStatus } from '@/types';
import { Banknote, CircleAlert, Clock3, Wallet } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMemo, useState } from 'react';

type DeskTab = 'ready' | 'attention' | 'queued' | 'paid';

function matchesWithdrawStatus(
  status: string | undefined,
  statusKey: string | undefined,
  target: 'PENDING' | 'APPROVED',
) {
  const raw = String(statusKey || status || '').toUpperCase();
  if (target === 'PENDING') {
    return raw === WithdrawStatus.Pending || raw === 'PENDING';
  }
  return raw === WithdrawStatus.Approved || raw === 'APPROVED';
}

export default function WithdrawsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<DeskTab>('ready');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const deskEnabled = tab === 'ready' || tab === 'attention';
  const {
    rows,
    meta,
    paginatorInfo: deskPaginator,
    loading: deskLoading,
    error: deskError,
  } = useSettlementsDeskQuery(
    {
      tab: tab === 'attention' ? 'attention' : 'ready',
      page,
      limit: 20,
      search: search || undefined,
    },
    { enabled: deskEnabled },
  );

  const withdrawStatus =
    tab === 'queued' ? WithdrawStatus.Pending : WithdrawStatus.Approved;
  const {
    withdraws: withdrawsRaw,
    paginatorInfo: withdrawPaginator,
    loading: withdrawLoading,
    error: withdrawError,
  } = useWithdrawsQuery(
    {
      limit: 20,
      page,
      orderBy: 'created_at',
      sortedBy: 'desc' as any,
      status: withdrawStatus,
    } as any,
    { enabled: tab === 'queued' || tab === 'paid' },
  );

  const withdraws = useMemo(() => {
    const target = tab === 'queued' ? 'PENDING' : 'APPROVED';
    return (withdrawsRaw ?? []).filter((w) =>
      matchesWithdrawStatus(
        w.status as string | undefined,
        w.status_key,
        target,
      ),
    );
  }, [withdrawsRaw, tab]);

  const { price: readyPendingPrice } = usePrice({
    amount: meta?.total_pending_ready ?? 0,
  });

  const tabs: Array<{ id: DeskTab; label: string; count?: number }> = [
    {
      id: 'ready',
      label: t('common:text-ready-to-pay') || 'Ready to pay',
      count: meta?.ready_count,
    },
    {
      id: 'attention',
      label: t('common:text-needs-attention') || 'Needs attention',
      count: meta?.attention_count,
    },
    {
      id: 'queued',
      label: t('common:text-queued') || 'Queued',
      count: meta?.queued_count,
    },
    {
      id: 'paid',
      label: t('common:text-paid') || 'Paid',
    },
  ];

  const loading =
    (deskEnabled && deskLoading) ||
    ((tab === 'queued' || tab === 'paid') && withdrawLoading);
  const error = deskEnabled ? deskError : withdrawError;

  if (loading && !rows.length && !withdraws.length) {
    return <Loader text={t('common:text-loading')} />;
  }
  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <StatStrip columns={4}>
        <StatMetric
          icon={<Wallet className="h-5 w-5" />}
          label={t('common:text-ready-to-pay') || 'Ready to pay'}
          value={meta?.ready_count ?? '—'}
        />
        <StatMetric
          icon={<Banknote className="h-5 w-5" />}
          label={t('common:text-pending-ready-total') || 'Ready pending'}
          value={meta?.total_pending_ready != null ? readyPendingPrice : '—'}
        />
        <StatMetric
          icon={<CircleAlert className="h-5 w-5" />}
          label={t('common:text-needs-attention') || 'Needs attention'}
          value={meta?.attention_count ?? '—'}
        />
        <StatMetric
          icon={<Clock3 className="h-5 w-5" />}
          label={t('common:text-queued') || 'Queued'}
          value={meta?.queued_count ?? '—'}
        />
      </StatStrip>

      <DataPanel
        className="mb-0"
        title={t('common:text-settlements-desk') || 'Settlements desk'}
        subtitle={
          t('common:text-settlements-desk-subtitle') ||
          'Queue safe payouts, export for bank transfer, then Mark paid.'
        }
        toolbarLayout="stacked"
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {deskEnabled ? (
              <form
                className="flex w-full max-w-sm gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  setSearch(searchInput.trim());
                }}
              >
                <Input
                  name="desk-search"
                  placeholder={
                    t('common:text-search-shops') || 'Search shops…'
                  }
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  variant="outline"
                  className="mb-0 flex-1"
                  inputClassName="!h-9"
                />
                <ActionButton type="submit" size="sm" variant="secondary">
                  {t('common:text-search') || 'Search'}
                </ActionButton>
              </form>
            ) : null}
            <LinkActionButton
              href={Routes.withdraw.create}
              variant="secondary"
              size="sm"
              className="w-full justify-center sm:w-auto"
            >
              {t('form:button-label-add-withdraw') || 'Create payout'}
            </LinkActionButton>
          </div>
        }
        filters={
          <div
            className="inline-flex flex-wrap rounded-full bg-muted/80 p-1"
            role="tablist"
            aria-label={t('common:text-settlements-desk') || 'Settlements desk'}
          >
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(item.id);
                    setPage(1);
                  }}
                  className={cn(
                    'relative z-10 h-8 rounded-full px-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-background text-accent shadow-sm'
                      : 'text-body hover:text-heading',
                  )}
                >
                  {item.label}
                  {item.count != null ? (
                    <span className="ms-1 text-xs opacity-70">
                      ({item.count})
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        }
      >
        {tab === 'ready' || tab === 'attention' ? (
          <SettlementsDeskShopTable
            rows={rows}
            mode={tab}
            paginatorInfo={deskPaginator}
            onPagination={setPage}
          />
        ) : (
          <SettlementsDeskWithdrawTable
            withdraws={withdraws}
            paginatorInfo={withdrawPaginator}
            onPagination={setPage}
            enableBulkPaid={tab === 'queued'}
          />
        )}
      </DataPanel>
    </div>
  );
}

WithdrawsPage.authenticate = {
  permissions: adminOnly,
};
WithdrawsPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
