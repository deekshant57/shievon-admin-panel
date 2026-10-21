import Layout from '@/components/layouts/admin';
import DataPanel from '@/components/page/data-panel';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import Select from '@/components/ui/select/select';
import { Table } from '@/components/ui/table';
import Pagination from '@/components/ui/pagination';
import Button from '@/components/ui/button';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { adminOnly } from '@/utils/auth-utils';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Routes } from '@/config/routes';
import { useDeliveryIssuesQuery } from '@/data/delivery-issues';
import { NoDataFound } from '@/components/icons/no-data-found';
import dayjs from 'dayjs';

const QUEUE_OPTIONS = [
  { name: 'Delivery issues', value: 'issues' },
  { name: 'In progress (ops)', value: 'in_progress_ops' },
];

export default function DeliveryIssuesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [queue, setQueue] = useState<'issues' | 'in_progress_ops'>('issues');

  const { orders, paginatorInfo, loading, error } = useDeliveryIssuesQuery({
    page,
    limit: 20,
    queue,
  });

  if (loading) return <Loader text={t('common:text-loading')} />;
  if (error) return <ErrorMessage message={error.message} />;

  const columns = [
    {
      title: 'Order',
      dataIndex: 'tracking_number',
      key: 'tracking_number',
      align: 'left' as const,
      render: (_: unknown, record: any) => (
        <span className="font-medium text-accent">#{record.tracking_number}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'order_status',
      key: 'order_status',
      align: 'left' as const,
    },
    {
      title: 'Shipment',
      dataIndex: 'deliveries',
      key: 'shipment_status',
      align: 'left' as const,
      render: (_: unknown, record: any) =>
        record.deliveries?.[0]?.shipment_status ?? '—',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      align: 'left' as const,
      render: (_: unknown, record: any) => record.customer?.name ?? '—',
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      align: 'left' as const,
      render: (updated_at: string) =>
        updated_at ? dayjs(updated_at).format('MMM DD, YYYY hh:mm A') : '—',
    },
    {
      title: '',
      dataIndex: 'id',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: any) => (
        <Button
          size="small"
          onClick={() =>
            router.push(Routes.deliveryIssues.details(record.id))
          }
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      <DataPanel
        className="mb-0"
        title="Delivery issues"
        toolbarLayout="stacked"
        toolbar={
          <div className="w-full md:max-w-sm md:ms-auto">
            <Select
              options={QUEUE_OPTIONS}
              getOptionLabel={(option: any) => option.name}
              getOptionValue={(option: any) => option.value}
              placeholder="Queue"
              defaultValue={QUEUE_OPTIONS[0]}
              onChange={(option: any) => {
                setQueue(option?.value ?? 'issues');
                setPage(1);
              }}
            />
          </div>
        }
      >
        <div className="mb-4 px-5 pt-5 text-sm text-body">
          {paginatorInfo?.total ?? 0} order(s) in queue
        </div>
        {orders.length ? (
          <>
            <Table
              //@ts-ignore
              columns={columns}
              data={orders}
              rowKey="id"
              scroll={{ x: 900 }}
            />
            {paginatorInfo && (
              <div className="flex justify-end border-t border-gray-200 p-4">
                <Pagination
                  total={paginatorInfo.total}
                  current={paginatorInfo.currentPage}
                  pageSize={paginatorInfo.perPage}
                  onChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center py-16">
            <NoDataFound className="w-52" />
            <p className="mt-4 text-sm text-body">No delivery issues found</p>
          </div>
        )}
      </DataPanel>
    </div>
  );
}

DeliveryIssuesPage.authenticate = {
  permissions: adminOnly,
};
DeliveryIssuesPage.Layout = Layout;

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['table', 'common', 'form'])),
  },
});
