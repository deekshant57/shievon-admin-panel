import MiniBarChart from '@/components/dashboard/mini-bar-chart';
import type { DashboardVariant } from '@/components/dashboard/layout/dashboard-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslation } from 'next-i18next';

export type SparklinePoint = {
  label: string;
  value: number;
};

type DashboardKpiBentoProps = {
  variant: DashboardVariant;
  totalRevenue: string;
  sparkline: SparklinePoint[];
  totalOrders?: string | number;
  totalVendors?: string | number;
  totalShops?: string | number;
  todaysRevenue?: string;
  totalRefunds?: string;
};

const DashboardKpiBento = ({
  variant,
  totalRevenue,
  sparkline,
  totalOrders,
  totalVendors,
  totalShops,
  todaysRevenue,
  totalRefunds,
}: DashboardKpiBentoProps) => {
  const { t } = useTranslation('widgets');

  return (
    <div className="grid gap-4 md:grid-cols-6 lg:grid-cols-12">
      <Card className="relative overflow-hidden border-border/60 shadow-sm md:col-span-6 lg:col-span-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent" />
        <CardHeader className="relative pb-2">
          <CardDescription>{t('sticker-card-title-rev')}</CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight md:text-4xl">
            {totalRevenue}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {sparkline.length > 0 ? (
            <div className="mt-2">
              <MiniBarChart data={sparkline} barClassName="bg-primary" />
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              {t('sticker-card-subtitle-rev')}
            </div>
          )}
        </CardContent>
      </Card>

      {variant === 'admin' ? (
        <>
          <Card className="border-border/60 shadow-sm md:col-span-2 lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOrders ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('sticker-card-title-order')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm md:col-span-2 lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVendors ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('sticker-card-title-vendor')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm md:col-span-6 lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalShops ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('sticker-card-title-total-shops')}
                </p>
                {todaysRevenue ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('sticker-card-title-today-rev')}: {todaysRevenue}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card className="border-border/60 shadow-sm md:col-span-2 lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRefunds ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('sticker-card-title-today-refunds')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm md:col-span-2 lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalShops ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('sticker-card-title-total-shops')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm md:col-span-6 lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-between p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todaysRevenue ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('sticker-card-title-today-rev')}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardKpiBento;
