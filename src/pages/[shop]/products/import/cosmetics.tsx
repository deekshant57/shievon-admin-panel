import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import ShopLayout from '@/components/layouts/shop';
import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox/checkbox';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { Table } from '@/components/ui/table';
import { Routes } from '@/config/routes';
import {
  useCommitCosmeticsImportMutation,
  useCosmeticsImportJobQuery,
  useCosmeticsImportJobsQuery,
  useDownloadCosmeticsImportReportMutation,
  useDownloadCosmeticsTemplateMutation,
  usePreviewCosmeticsImportMutation,
} from '@/data/import';
import { useShopQuery } from '@/data/shop';
import {
  CosmeticsImportError,
  CosmeticsImportGroupError,
  CosmeticsImportInactiveMatch,
  CosmeticsImportJob,
  CosmeticsImportNewValue,
} from '@/types';
import {
  adminAndOwnerOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { STORE_OWNER, SUPER_ADMIN } from '@/utils/constants';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const ACTIVE_JOB_STATUSES = [
  'uploaded',
  'previewing',
  'commit_queued',
  'committing',
];

// The columns of the template, in order. Which are required follows the template
// (the first ten); the sentences about each one live in common.json.
const REQUIRED_FIELDS = [
  'parent_sku',
  'sku',
  'type_of_product',
  'name',
  'category',
  'sub_category',
  'mrp',
  'ssp',
  'stock_quantity',
  'pack_size',
];
const OPTIONAL_FIELDS = [
  'pack_type',
  'sku_weight',
  'case_size',
  'description',
  'featured_image',
  'gallery_images',
];
const COLUMN_GUIDE: Array<{ column: string; example: string }> = [
  { column: 'parent_sku', example: 'SHM-MOIST' },
  { column: 'sku', example: 'SHM300' },
  { column: 'type_of_product', example: 'Professional' },
  { column: 'name', example: 'Heavy Moisturising Shampoo' },
  { column: 'category', example: 'Hair Care' },
  { column: 'sub_category', example: 'Shampoo' },
  { column: 'mrp', example: '575' },
  { column: 'ssp', example: '499' },
  { column: 'stock_quantity', example: '25' },
  { column: 'pack_size', example: '300ml' },
  { column: 'pack_type', example: 'Bottle' },
  { column: 'sku_weight', example: '340 gm' },
  { column: 'case_size', example: '24' },
  { column: 'description', example: 'Deep moisture for dry, frizzy hair.' },
  { column: 'featured_image', example: '' },
  { column: 'gallery_images', example: '' },
];
const EXAMPLE_COLUMNS = [
  'parent_sku',
  'sku',
  'type_of_product',
  'name',
  'category',
  'sub_category',
  'mrp',
  'ssp',
  'stock_quantity',
  'pack_size',
  'pack_type',
  'sku_weight',
  'case_size',
];
const EXAMPLE_ROWS: string[][] = [
  [
    'SHM-MOIST',
    'SHM300',
    'Professional',
    'Heavy Moisturising Shampoo',
    'Hair Care',
    'Shampoo',
    '575',
    '499',
    '25',
    '300ml',
    'Bottle',
    '340 gm',
    '24',
  ],
  [
    'SHM-MOIST',
    'SHM1000',
    'Professional',
    'Heavy Moisturising Shampoo',
    'Hair Care',
    'Shampoo',
    '1450',
    '1299',
    '10',
    '1000ml',
    'Bottle',
    '1100 gm',
    '12',
  ],
];
const INSTRUCTION_RULES = [
  'cosmetics-import-rule-one-row',
  'cosmetics-import-rule-parent-sku',
  'cosmetics-import-rule-unique-sku',
  'cosmetics-import-rule-mrp-ssp',
  'cosmetics-import-rule-verbatim',
  'cosmetics-import-rule-new-values',
  'cosmetics-import-rule-approval',
  'cosmetics-import-rule-close-match',
  'cosmetics-import-rule-stock',
  'cosmetics-import-rule-images',
  'cosmetics-import-rule-row-limit',
  'cosmetics-import-rule-do-not-edit-template',
];

function getJobId(job?: CosmeticsImportJob) {
  return job?.jobId;
}

function getCounts(job?: CosmeticsImportJob) {
  return job?.counts ?? {};
}

function hasBlockingErrors(job?: CosmeticsImportJob) {
  const counts = getCounts(job);
  return (
    Boolean(counts.invalid_rows && counts.invalid_rows > 0) ||
    Boolean(job?.group_errors?.length) ||
    Boolean(job?.errors?.length)
  );
}

function isMissingEndpointError(error: unknown) {
  return (error as any)?.response?.status === 404;
}

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string | undefined;
}) {
  return (
    <div className="rounded border border-border-200 bg-gray-50 p-4">
      <p className="text-xs uppercase tracking-wide text-body">{label}</p>
      <p className="mt-2 text-xl font-semibold text-heading">{value ?? 0}</p>
    </div>
  );
}

function FieldSentence({
  title,
  intro,
  fields,
}: {
  title: string;
  intro: string;
  fields: string[];
}) {
  return (
    <div className="rounded border border-border-200 bg-gray-50 p-4">
      <p className="font-semibold text-heading">{title}</p>
      <p className="mt-2 text-sm text-body">
        {intro}{' '}
        {fields.map((field, index) => (
          <span key={field}>
            <code>{field}</code>
            {index < fields.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </p>
    </div>
  );
}

function SimpleTable({
  head,
  rows,
}: {
  head: string[];
  rows: Array<Array<string | JSX.Element>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm text-body">
        <thead>
          <tr className="border-b border-border-200">
            {head.map((cell) => (
              <th
                key={cell}
                className="whitespace-nowrap px-3 py-2 font-semibold text-heading"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border-200 last:border-b-0"
            >
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CosmeticsImportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { query } = router;
  const { permissions, role } = getAuthCredentials();
  const shop = query.shop as string;
  const storageKey = shop ? `cosmetics-import:${shop}` : '';

  const [xlsx, setXlsx] = useState<File | null>(null);
  const [zip, setZip] = useState<File | null>(null);
  const [previewJob, setPreviewJob] = useState<
    CosmeticsImportJob | undefined
  >();
  const [jobId, setJobId] = useState<string | undefined>();
  const [fileError, setFileError] = useState('');
  const [confirmed, setConfirmed] = useState<string[]>([]);
  // One key per job, so a retry or a double click is the same request to the API.
  const idempotency = useRef<{ jobId: string; key: string } | null>(null);

  const text = (key: string, fallback: string) => {
    const value = t(`common:${key}`);
    return value === key || value === `common:${key}` ? fallback : value;
  };

  const hasWriteAccess =
    hasAccess(adminAndOwnerOnly, permissions) ||
    role === SUPER_ADMIN ||
    role === STORE_OWNER;

  const {
    data: shopData,
    isLoading: fetchingShop,
    error: shopError,
  } = useShopQuery({
    slug: shop,
  });
  const shopId = shopData?.id;

  const templateMutation = useDownloadCosmeticsTemplateMutation();
  const previewMutation = usePreviewCosmeticsImportMutation();
  const commitMutation = useCommitCosmeticsImportMutation();
  const reportMutation = useDownloadCosmeticsImportReportMutation();
  const {
    jobs,
    loading: fetchingHistory,
    error: historyError,
  } = useCosmeticsImportJobsQuery(
    shopId
      ? {
          shopId,
        }
      : undefined,
    {
      enabled: Boolean(shopId),
    }
  );

  const isActiveJob =
    jobId && ACTIVE_JOB_STATUSES.includes(String(previewJob?.status));
  const { job: polledJob } = useCosmeticsImportJobQuery(jobId, {
    enabled: Boolean(jobId),
    refetchInterval: isActiveJob ? 5000 : false,
  });

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    const savedState = window.localStorage.getItem(storageKey);
    if (!savedState) return;

    try {
      const parsed = JSON.parse(savedState);
      setJobId(parsed.jobId);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (polledJob) {
      setPreviewJob(polledJob);
    }
  }, [polledJob]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        jobId,
      })
    );
  }, [jobId, storageKey]);

  const currentJob = previewJob ?? polledJob;
  const currentJobId = getJobId(currentJob);

  // Ticks belong to one job: start clean when another one is opened, and show
  // what was already confirmed on a job that has been committed.
  useEffect(() => {
    setConfirmed(currentJob?.confirmed ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJobId]);

  const counts = getCounts(currentJob);
  const flatErrors = currentJob?.errors ?? [];
  const groupErrors = currentJob?.group_errors ?? [];
  const newValues = currentJob?.new_values ?? [];
  const nearDuplicates = currentJob?.near_duplicates ?? [];
  const inactiveMatches = currentJob?.inactive_matches ?? [];
  const currentStatus = String(currentJob?.status ?? '');
  const importCompleted = currentStatus === 'completed';
  const importFailed = ['failed', 'preview_failed'].includes(currentStatus);
  const importRunning = ['commit_queued', 'committing'].includes(
    currentStatus
  );
  const importExpired = currentStatus === 'expired';
  const historyUnavailable = isMissingEndpointError(historyError);
  const remainingToConfirm = nearDuplicates.filter(
    (value) => !confirmed.includes(value.id)
  ).length;
  const canConfirm =
    Boolean(currentJobId) &&
    currentStatus === 'preview_ready' &&
    !hasBlockingErrors(currentJob) &&
    remainingToConfirm === 0 &&
    !commitMutation.isLoading;
  const result = currentJob?.summary;

  if (fetchingShop) {
    return <Loader text={t('common:text-loading')} />;
  }

  if (shopError) {
    return (
      <ErrorMessage message={t('common:error-shop-not-found') || 'Shop not found'} />
    );
  }

  if (!hasWriteAccess) {
    return (
      <ErrorMessage
        message={
          t('common:cosmetics-import-owner-only') ||
          'Only store owners can import products.'
        }
      />
    );
  }

  function validateFiles() {
    if (!xlsx || !xlsx.name.toLowerCase().endsWith('.xlsx')) {
      return t('common:cosmetics-import-xlsx-required');
    }
    if (zip && !zip.name.toLowerCase().endsWith('.zip')) {
      return t('common:cosmetics-import-zip-invalid');
    }
    return '';
  }

  function handleDownloadTemplate() {
    if (!shopId) return;
    templateMutation.mutate({ shopId });
  }

  function handlePreview() {
    const validationMessage = validateFiles();
    setFileError(validationMessage);
    if (validationMessage || !shopId || !xlsx) return;

    previewMutation.mutate(
      {
        shopId,
        xlsx,
        zip,
      },
      {
        onSuccess: (job) => {
          setPreviewJob(job);
          setJobId(getJobId(job));
        },
      }
    );
  }

  function handleOpenHistoryJob(job: CosmeticsImportJob) {
    setPreviewJob(job);
    setJobId(getJobId(job));
  }

  function handleCommit() {
    if (!currentJobId) return;
    if (idempotency.current?.jobId !== currentJobId) {
      idempotency.current = { jobId: currentJobId, key: makeIdempotencyKey() };
    }
    commitMutation.mutate(
      {
        jobId: currentJobId,
        idempotencyKey: idempotency.current.key,
        confirmedNearDuplicates: confirmed,
      },
      {
        onSuccess: (job) => {
          setPreviewJob(job);
          setJobId(getJobId(job));
        },
      }
    );
  }

  function toggleConfirmed(id: string, checked: boolean) {
    setConfirmed((current) =>
      checked
        ? current.filter((x) => x !== id).concat(id)
        : current.filter((x) => x !== id)
    );
  }

  const kindLabel = (field: string) =>
    text(`cosmetics-import-kind-${field}`, field);

  const errorColumns = [
    {
      title: t('common:cosmetics-import-row'),
      dataIndex: 'row',
      key: 'row',
      width: 80,
      render: (row: number) => row ?? '-',
    },
    {
      title: t('common:cosmetics-import-parent-sku'),
      dataIndex: 'parent_sku',
      key: 'parent_sku',
      width: 140,
      render: (parentSku: string) => parentSku ?? '-',
    },
    {
      title: t('common:cosmetics-import-sku'),
      dataIndex: 'sku',
      key: 'sku',
      width: 140,
      render: (sku: string) => sku ?? '-',
    },
    {
      title: t('common:cosmetics-import-field'),
      dataIndex: 'field',
      key: 'field',
      width: 140,
      render: (field: string) => field ?? '-',
    },
    {
      title: t('common:cosmetics-import-code'),
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (code: string) => code ?? '-',
    },
    {
      title: t('common:cosmetics-import-errors'),
      dataIndex: 'message',
      key: 'message',
    },
  ];

  const groupColumns = [
    {
      title: t('common:cosmetics-import-parent-sku'),
      dataIndex: 'parent_sku',
      key: 'parent_sku',
      width: 180,
      render: (parentSku: string) => parentSku ?? '-',
    },
    {
      title: t('common:cosmetics-import-rows'),
      dataIndex: 'rows',
      key: 'rows',
      width: 140,
      render: (rows: number[]) => rows?.join(', ') ?? '-',
    },
    {
      title: t('common:cosmetics-import-errors'),
      dataIndex: 'message',
      key: 'message',
    },
  ];

  const historyColumns = [
    {
      title: t('common:cosmetics-import-job-id'),
      dataIndex: 'jobId',
      key: 'jobId',
      width: 140,
      render: (_: unknown, job: CosmeticsImportJob) =>
        getJobId(job)?.slice(0, 8) ?? '-',
    },
    {
      title: t('common:cosmetics-import-job-status'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => status ?? '-',
    },
    {
      title: t('common:cosmetics-import-total-rows'),
      dataIndex: 'counts',
      key: 'counts',
      width: 130,
      render: (_: unknown, job: CosmeticsImportJob) =>
        getCounts(job).total_rows ?? '-',
    },
    {
      title: t('common:cosmetics-import-created'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200,
      render: (value: string) => formatDate(value),
    },
    {
      title: t('common:cosmetics-import-actions'),
      dataIndex: 'actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, job: CosmeticsImportJob) => (
        <Button
          size="small"
          variant="outline"
          onClick={() => handleOpenHistoryJob(job)}
        >
          {t('common:cosmetics-import-open-job')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeading title={t('common:cosmetics-import-title')} />
        <Button
          variant="outline"
          onClick={() => router.push(`/${shop}${Routes.product.list}`)}
        >
          {t('form:button-label-back')}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-heading">
                {text('cosmetics-import-history', 'Import history')}
              </h2>
              <p className="mt-2 text-sm text-body">
                {text(
                  'cosmetics-import-history-help',
                  'Reopen a recent Cosmetics import to review its status, errors, or report.'
                )}
              </p>
            </div>
            {fetchingHistory && (
              <span className="text-sm text-body">
                {t('common:text-loading')}
              </span>
            )}
          </div>

          {historyError && !historyUnavailable && (
            <Alert
              className="mb-5"
              variant="warning"
              message={historyError.message}
            />
          )}

          {historyUnavailable ? (
            <p className="text-sm text-body">
              {text(
                'cosmetics-import-history-unavailable',
                'Import history is not available from the backend yet.'
              )}
            </p>
          ) : jobs.length ? (
            <Table
              columns={historyColumns}
              data={jobs.slice(0, 5)}
              rowKey={(record: CosmeticsImportJob, index: number) =>
                `${getJobId(record) ?? 'job'}-${index}`
              }
            />
          ) : (
            <p className="text-sm text-body">
              {text(
                'cosmetics-import-no-history',
                'No Cosmetics imports found for this shop yet.'
              )}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-heading">
              {t('common:cosmetics-import-step-instructions')}
            </h2>
            <p className="mt-2 text-sm text-body">
              {t('common:cosmetics-import-instructions-help')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldSentence
              title={t('common:cosmetics-import-required-title')}
              intro={t('common:cosmetics-import-required-text')}
              fields={REQUIRED_FIELDS}
            />
            <FieldSentence
              title={t('common:cosmetics-import-optional-title')}
              intro={t('common:cosmetics-import-optional-text')}
              fields={OPTIONAL_FIELDS}
            />
          </div>

          <div className="mt-5 rounded border border-border-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-heading">
              {t('common:cosmetics-import-rules-title')}
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-body">
              {INSTRUCTION_RULES.map((ruleKey) => (
                <li key={ruleKey}>{t(`common:${ruleKey}`)}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded border border-border-200 p-4">
            <h3 className="mb-3 font-semibold text-heading">
              {t('common:cosmetics-import-guide-title')}
            </h3>
            <SimpleTable
              head={[
                t('common:cosmetics-import-guide-column'),
                t('common:cosmetics-import-guide-required'),
                t('common:cosmetics-import-guide-what'),
                t('common:cosmetics-import-guide-example'),
              ]}
              rows={COLUMN_GUIDE.map(({ column, example }) => [
                <code key={column}>{column}</code>,
                REQUIRED_FIELDS.includes(column)
                  ? t('common:cosmetics-import-yes')
                  : t('common:cosmetics-import-no'),
                t(`common:cosmetics-import-col-${column}`),
                example || '-',
              ])}
            />
          </div>

          <div className="mt-5 rounded border border-border-200 p-4">
            <h3 className="font-semibold text-heading">
              {t('common:cosmetics-import-example-title')}
            </h3>
            <p className="mb-3 mt-2 text-sm text-body">
              {t('common:cosmetics-import-example-help')}
            </p>
            <SimpleTable head={EXAMPLE_COLUMNS} rows={EXAMPLE_ROWS} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-heading">
              {t('common:cosmetics-import-step-template')}
            </h2>
            <p className="mt-2 text-sm text-body">
              {t('common:cosmetics-import-template-help')}
            </p>
          </div>

          <Button
            onClick={handleDownloadTemplate}
            loading={templateMutation.isLoading}
            disabled={!shopId || templateMutation.isLoading}
          >
            {text(
              'cosmetics-import-download-template',
              'Download Bulk Import Template'
            )}
          </Button>
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-heading">
              {t('common:cosmetics-import-step-upload')}
            </h2>
            <p className="mt-2 text-sm text-body">
              {t('common:cosmetics-import-upload-help')}
            </p>
          </div>

          <Alert
            variant="info"
            className="mb-5"
            message={t('common:cosmetics-import-preview-warning')}
          />
          <Alert
            variant="warning"
            className="mb-5 md:hidden"
            message={t('common:cosmetics-import-desktop-warning')}
          />

          {fileError && (
            <Alert className="mb-5" variant="error" message={fileError} />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block rounded border border-border-200 p-4">
              <span className="mb-2 block text-sm font-semibold text-heading">
                {t('common:cosmetics-import-xlsx-file')}
              </span>
              <input
                type="file"
                accept=".xlsx"
                onChange={(event) => {
                  setXlsx(event.target.files?.[0] ?? null);
                  setFileError('');
                }}
              />
              {xlsx && <p className="mt-2 text-sm text-body">{xlsx.name}</p>}
            </label>

            <label className="block rounded border border-border-200 p-4">
              <span className="mb-2 block text-sm font-semibold text-heading">
                {t('common:cosmetics-import-zip-file')}
              </span>
              <input
                type="file"
                accept=".zip"
                onChange={(event) => {
                  setZip(event.target.files?.[0] ?? null);
                  setFileError('');
                }}
              />
              {zip && <p className="mt-2 text-sm text-body">{zip.name}</p>}
            </label>
          </div>

          <div className="mt-5">
            <Button
              onClick={handlePreview}
              loading={previewMutation.isLoading}
              disabled={!shopId || !xlsx || previewMutation.isLoading}
            >
              {t('common:cosmetics-import-preview')}
            </Button>
          </div>
        </Card>

        {currentJob && (
          <Card className="p-6">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-semibold text-heading">
                  {t('common:cosmetics-import-step-review')}
                </h2>
                <p className="mt-2 text-sm text-body">
                  {t('common:cosmetics-import-job-status')}:{' '}
                  {currentJob.status ?? '-'}
                </p>
              </div>
              <div className="flex gap-3">
                {currentJobId && (
                  <Button
                    variant="outline"
                    onClick={() => reportMutation.mutate(currentJobId)}
                    loading={reportMutation.isLoading}
                  >
                    {t('common:cosmetics-import-download-report')}
                  </Button>
                )}
                <Button
                  onClick={handleCommit}
                  loading={commitMutation.isLoading}
                  disabled={!canConfirm}
                >
                  {t('common:cosmetics-import-confirm')}
                </Button>
              </div>
            </div>

            {importCompleted ? (
              <>
                <Alert
                  className="mb-5"
                  variant="success"
                  message={t('common:cosmetics-import-completed')}
                />
                {Boolean(
                  result?.categories_created ||
                    result?.sub_categories_created ||
                    result?.types_of_product_created
                ) && (
                  <Alert
                    className="mb-5"
                    variant="info"
                    message={t('common:cosmetics-import-completed-approval')}
                  />
                )}
              </>
            ) : importRunning ? (
              <Alert
                className="mb-5"
                variant="info"
                message={
                  currentStatus === 'commit_queued'
                    ? t('common:cosmetics-import-queued')
                    : t('common:cosmetics-import-committing')
                }
              />
            ) : importExpired ? (
              <Alert
                className="mb-5"
                variant="warning"
                message={t('common:cosmetics-import-expired')}
              />
            ) : currentStatus === 'failed' ? (
              <Alert
                className="mb-5"
                variant="error"
                message={
                  currentJob.message ?? t('common:cosmetics-import-failed')
                }
              />
            ) : hasBlockingErrors(currentJob) || importFailed ? (
              <Alert
                className="mb-5"
                variant="warning"
                message={t('common:cosmetics-import-blocking-errors')}
              />
            ) : remainingToConfirm > 0 ? (
              <Alert
                className="mb-5"
                variant="warning"
                message={t('common:cosmetics-import-ready-needs-confirmation')}
              />
            ) : (
              <Alert
                className="mb-5"
                variant="success"
                message={t('common:cosmetics-import-ready')}
              />
            )}

            {importCompleted && result ? (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-heading">
                  {t('common:cosmetics-import-result-title')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard
                    label={t('common:cosmetics-import-products-created')}
                    value={result.products_created}
                  />
                  <SummaryCard
                    label={t('common:cosmetics-import-products-updated')}
                    value={result.products_updated}
                  />
                  <SummaryCard
                    label={t('common:cosmetics-import-variants-created')}
                    value={result.variants_created}
                  />
                  <SummaryCard
                    label={t('common:cosmetics-import-variants-updated')}
                    value={result.variants_updated}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label={t('common:cosmetics-import-total-rows')}
                  value={counts.total_rows}
                />
                <SummaryCard
                  label={t('common:cosmetics-import-valid-rows')}
                  value={counts.valid_rows}
                />
                <SummaryCard
                  label={t('common:cosmetics-import-invalid-rows')}
                  value={counts.invalid_rows}
                />
                <SummaryCard
                  label={t('common:cosmetics-import-images')}
                  value={counts.images_to_upload}
                />
                <SummaryCard
                  label={t('common:cosmetics-import-products-create')}
                  value={counts.products_to_create}
                />
                <SummaryCard
                  label={t('common:cosmetics-import-products-update')}
                  value={counts.products_to_update}
                />
                <SummaryCard
                  label={t('common:cosmetics-import-variants-create')}
                  value={counts.variants_to_create}
                />
                <SummaryCard
                  label={t('common:cosmetics-import-variants-update')}
                  value={counts.variants_to_update}
                />
              </div>
            )}

            {nearDuplicates.length > 0 && (
              <div className="mb-6 rounded border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-heading">
                      {t('common:cosmetics-import-confirm-title')}
                    </h3>
                    <p className="mt-2 text-sm text-body">
                      {t('common:cosmetics-import-confirm-help')}
                    </p>
                  </div>
                  {currentStatus === 'preview_ready' && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-body">
                        {t('common:cosmetics-import-confirm-remaining', {
                          count: remainingToConfirm,
                        })}
                      </span>
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() =>
                          setConfirmed(nearDuplicates.map((value) => value.id))
                        }
                      >
                        {t('common:cosmetics-import-confirm-all')}
                      </Button>
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => setConfirmed([])}
                      >
                        {t('common:cosmetics-import-confirm-none')}
                      </Button>
                    </div>
                  )}
                </div>
                <ul className="mt-4 space-y-3">
                  {nearDuplicates.map((value: CosmeticsImportNewValue) => (
                    <li
                      key={value.id}
                      className="rounded border border-yellow-200 bg-white p-3"
                    >
                      <p className="text-sm text-body">
                        <span className="mr-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-heading">
                          {kindLabel(value.field)}
                        </span>
                        {value.message}
                      </p>
                      <Checkbox
                        className="mt-3"
                        name={`confirm-${value.id}`}
                        label={t('common:cosmetics-import-confirm-label', {
                          name: value.name,
                        })}
                        checked={confirmed.includes(value.id)}
                        disabled={currentStatus !== 'preview_ready'}
                        onChange={(event) =>
                          toggleConfirmed(value.id, event.target.checked)
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {newValues.length > 0 && (
              <div className="mb-6 rounded border border-border-200 p-4">
                <h3 className="font-semibold text-heading">
                  {t('common:cosmetics-import-new-values-title')}
                </h3>
                <p className="mt-2 text-sm text-body">
                  {t('common:cosmetics-import-new-values-help')}
                </p>
                <ul className="mt-4 space-y-3">
                  {newValues.map((value: CosmeticsImportNewValue) => (
                    <li
                      key={value.id}
                      className="rounded border border-border-200 bg-gray-50 p-3 text-sm text-body"
                    >
                      <span className="mr-2 rounded bg-white px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-heading">
                        {kindLabel(value.field)}
                      </span>
                      {value.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {inactiveMatches.length > 0 && (
              <div className="mb-6 rounded border border-border-200 p-4">
                <h3 className="font-semibold text-heading">
                  {t('common:cosmetics-import-pending-title')}
                </h3>
                <p className="mt-2 text-sm text-body">
                  {t('common:cosmetics-import-pending-help')}
                </p>
                <ul className="mt-4 space-y-3">
                  {inactiveMatches.map(
                    (match: CosmeticsImportInactiveMatch, index: number) => (
                      <li
                        key={`${match.field}-${match.mappedTo}-${index}`}
                        className="rounded border border-border-200 bg-gray-50 p-3 text-sm text-body"
                      >
                        <span className="mr-2 rounded bg-white px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-heading">
                          {kindLabel(match.field)}
                        </span>
                        {match.message}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {flatErrors.length ? (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-heading">
                  {t('common:cosmetics-import-row-errors')}
                </h3>
                <Table
                  columns={errorColumns}
                  data={flatErrors}
                  rowKey={(record: CosmeticsImportError, index: number) =>
                    `${record.sku ?? record.row ?? 'error'}-${index}`
                  }
                />
              </div>
            ) : null}

            {groupErrors.length ? (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-heading">
                  {t('common:cosmetics-import-group-errors')}
                </h3>
                <Table
                  columns={groupColumns}
                  data={groupErrors}
                  rowKey={(record: CosmeticsImportGroupError, index: number) =>
                    `${record.parent_sku ?? 'group'}-${index}`
                  }
                />
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </>
  );
}

CosmeticsImportPage.authenticate = {
  permissions: adminAndOwnerOnly,
};
CosmeticsImportPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
