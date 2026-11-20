import Card from '@/components/common/card';
import PageHeading from '@/components/common/page-heading';
import ShopLayout from '@/components/layouts/shop';
import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import ErrorMessage from '@/components/ui/error-message';
import Loader from '@/components/ui/loader/loader';
import { Table } from '@/components/ui/table';
import { Routes } from '@/config/routes';
import {
  useCommitJewelleryImportMutation,
  useDownloadJewelleryImportReportMutation,
  useDownloadJewelleryTemplateMutation,
  useJewelleryImportJobQuery,
  useJewelleryImportJobsQuery,
  usePreviewJewelleryImportMutation,
} from '@/data/import';
import { useShopQuery } from '@/data/shop';
import { JewelleryImportError, JewelleryImportJob } from '@/types';
import {
  adminAndOwnerOnly,
  getAuthCredentials,
  hasAccess,
} from '@/utils/auth-utils';
import { STORE_OWNER, SUPER_ADMIN } from '@/utils/constants';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const ACTIVE_JOB_STATUSES = [
  'uploaded',
  'previewing',
  'commit_queued',
  'committing',
];

const JEWELLERY_SHEETS = ['Men', 'Women'];

function isMissingEndpointError(error: unknown) {
  return (error as any)?.response?.status === 404;
}

function getJobId(job?: JewelleryImportJob) {
  return job?.jobId ?? job?.id ?? job?.job_id ?? job?.preview_token;
}

function getCounts(job?: JewelleryImportJob) {
  return job?.counts ?? job?.summary ?? {};
}

function getFlatErrors(job?: JewelleryImportJob) {
  return job?.errors ?? job?.row_errors ?? [];
}

function hasBlockingErrors(job?: JewelleryImportJob) {
  const counts = getCounts(job);
  return (
    Boolean(counts.invalid_rows && counts.invalid_rows > 0) ||
    Boolean(counts.blocked_groups && counts.blocked_groups > 0) ||
    getFlatErrors(job).length > 0
  );
}

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

export default function JewelleryImportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { query } = router;
  const { permissions, role } = getAuthCredentials();
  const shop = query.shop as string;
  const storageKey = shop ? `jewellery-import:${shop}` : '';

  const [xlsx, setXlsx] = useState<File | null>(null);
  const [zip, setZip] = useState<File | null>(null);
  const [previewJob, setPreviewJob] = useState<JewelleryImportJob | undefined>();
  const [jobId, setJobId] = useState<string | number | undefined>();
  const [fileError, setFileError] = useState('');

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

  const templateMutation = useDownloadJewelleryTemplateMutation();
  const previewMutation = usePreviewJewelleryImportMutation();
  const commitMutation = useCommitJewelleryImportMutation();
  const reportMutation = useDownloadJewelleryImportReportMutation();
  const {
    jobs,
    loading: fetchingHistory,
    error: historyError,
  } = useJewelleryImportJobsQuery(
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
  const { job: polledJob } = useJewelleryImportJobQuery(jobId, {
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
  const counts = getCounts(currentJob);
  const flatErrors = getFlatErrors(currentJob);
  const currentStatus = String(currentJob?.status ?? '');
  const importCompleted = currentStatus === 'completed';
  const importFailed = ['failed', 'preview_failed', 'expired'].includes(
    currentStatus
  );
  const historyUnavailable = isMissingEndpointError(historyError);
  const canConfirm =
    Boolean(currentJobId) &&
    !importCompleted &&
    !importFailed &&
    !hasBlockingErrors(currentJob) &&
    !commitMutation.isLoading;

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
          t('common:jewellery-import-owner-only') ||
          'Only store owners can import products.'
        }
      />
    );
  }

  function validateFiles() {
    if (!xlsx || !zip) {
      return t('common:jewellery-import-files-required');
    }
    if (!xlsx.name.toLowerCase().endsWith('.xlsx')) {
      return t('common:jewellery-import-xlsx-required');
    }
    if (!zip.name.toLowerCase().endsWith('.zip')) {
      return t('common:jewellery-import-zip-required');
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
    if (validationMessage || !shopId || !xlsx || !zip) return;

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

  function handleOpenHistoryJob(job: JewelleryImportJob) {
    const importJobId = getJobId(job);
    setPreviewJob(job);
    setJobId(importJobId);
  }

  function handleCommit() {
    if (!currentJobId) return;
    commitMutation.mutate(
      {
        jobId: currentJobId,
        idempotencyKey: makeIdempotencyKey(),
      },
      {
        onSuccess: (job) => {
          setPreviewJob(job);
          setJobId(getJobId(job));
        },
      }
    );
  }

  const errorColumns = [
    {
      title: t('common:jewellery-import-sheet'),
      dataIndex: 'sheet',
      key: 'sheet',
      width: 100,
      render: (sheet: string) => sheet ?? '-',
    },
    {
      title: t('common:jewellery-import-row'),
      dataIndex: 'row',
      key: 'row',
      width: 80,
      render: (row: number) => row ?? '-',
    },
    {
      title: t('common:jewellery-import-parent-sku'),
      dataIndex: 'parent_sku',
      key: 'parent_sku',
      width: 140,
      render: (parentSku: string) => parentSku ?? '-',
    },
    {
      title: t('common:jewellery-import-sku'),
      dataIndex: 'sku',
      key: 'sku',
      width: 140,
      render: (sku: string) => sku ?? '-',
    },
    {
      title: t('common:jewellery-import-field-category'),
      dataIndex: 'field',
      key: 'field',
      width: 140,
      render: (_: unknown, record: JewelleryImportError) =>
        record.field ?? record.category ?? '-',
    },
    {
      title: t('common:jewellery-import-code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => code ?? '-',
    },
    {
      title: t('common:jewellery-import-message'),
      dataIndex: 'message',
      key: 'message',
      render: (message: string) => message ?? '-',
    },
  ];

  const historyColumns = [
    {
      title: t('common:jewellery-import-job-id'),
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (_: unknown, job: JewelleryImportJob) => getJobId(job) ?? '-',
    },
    {
      title: t('common:jewellery-import-job-status'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => status ?? '-',
    },
    {
      title: t('common:jewellery-import-total-rows'),
      dataIndex: 'counts',
      key: 'counts',
      width: 130,
      render: (_: unknown, job: JewelleryImportJob) =>
        getCounts(job).total_rows ?? '-',
    },
    {
      title: t('common:jewellery-import-actions'),
      dataIndex: 'actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, job: JewelleryImportJob) => (
        <Button size="small" variant="outline" onClick={() => handleOpenHistoryJob(job)}>
          {t('common:jewellery-import-open-job')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeading title={t('common:jewellery-import-title')} />
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
                {text('jewellery-import-history', 'Import history')}
              </h2>
              <p className="mt-2 text-sm text-body">
                {text(
                  'jewellery-import-history-help',
                  'Reopen a recent jewellery import job to review its status, errors, or report.'
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
                'jewellery-import-history-unavailable',
                'Import history is not available from the backend yet.'
              )}
            </p>
          ) : jobs.length ? (
            <Table
              columns={historyColumns}
              data={jobs.slice(0, 5)}
              rowKey={(record: JewelleryImportJob, index) =>
                `${getJobId(record) ?? 'job'}-${index}`
              }
            />
          ) : (
            <p className="text-sm text-body">
              {text(
                'jewellery-import-no-history',
                'No jewellery import jobs found for this shop yet.'
              )}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-heading">
              {t('common:jewellery-import-step-workbook')}
            </h2>
            <p className="mt-2 text-sm text-body">
              {t('common:jewellery-import-workbook-help')}
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-body">
              {[
                'jewellery-import-detailed-step-download',
                'jewellery-import-detailed-step-fill',
                'jewellery-import-detailed-step-category',
                'jewellery-import-detailed-step-required',
                'jewellery-import-detailed-step-images',
                'jewellery-import-detailed-step-upload',
                'jewellery-import-detailed-step-preview',
              ].map((stepKey) => (
                <li key={stepKey}>{t(`common:${stepKey}`)}</li>
              ))}
            </ol>
            <div className="mt-5 rounded border border-border-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-heading">
                {t('common:jewellery-import-important-rules-title')}
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-body">
                {[
                  'jewellery-import-rule-category-dropdown',
                  'jewellery-import-rule-one-row',
                  'jewellery-import-rule-parent-sku',
                  'jewellery-import-rule-images',
                  'jewellery-import-rule-row-limit',
                  'jewellery-import-rule-do-not-edit-template',
                  'jewellery-import-rule-limits',
                ].map((ruleKey) => (
                  <li key={ruleKey}>{t(`common:${ruleKey}`)}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {JEWELLERY_SHEETS.map((sheetName) => (
              <div
                key={sheetName}
                className="rounded border border-border-200 bg-gray-50 p-4"
              >
                <p className="font-semibold text-heading">{sheetName}</p>
                <p className="mt-2 text-sm text-body">
                  {t('common:jewellery-import-workbook-sheet-help')}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-heading">
              {t('common:jewellery-import-step-template')}
            </h2>
            <p className="mt-2 text-sm text-body">
              {t('common:jewellery-import-template-help')}
            </p>
          </div>

          <Button
            onClick={handleDownloadTemplate}
            loading={templateMutation.isLoading}
            disabled={!shopId || templateMutation.isLoading}
          >
            {text('jewellery-import-download-template', 'Download Jewellery Template')}
          </Button>
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-heading">
              {t('common:jewellery-import-step-upload')}
            </h2>
            <p className="mt-2 text-sm text-body">
              {t('common:jewellery-import-upload-help')}
            </p>
          </div>

          <Alert
            variant="info"
            className="mb-5"
            message={t('common:jewellery-import-preview-warning')}
          />
          <Alert
            variant="warning"
            className="mb-5 md:hidden"
            message={t('common:jewellery-import-desktop-warning')}
          />

          {fileError && (
            <Alert className="mb-5" variant="error" message={fileError} />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block rounded border border-border-200 p-4">
              <span className="mb-2 block text-sm font-semibold text-heading">
                {t('common:jewellery-import-xlsx-file')}
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
                {t('common:jewellery-import-zip-file')}
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
              disabled={
                !shopId ||
                !xlsx ||
                !zip ||
                previewMutation.isLoading
              }
            >
              {t('common:jewellery-import-preview')}
            </Button>
          </div>
        </Card>

        {currentJob && (
          <Card className="p-6">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-semibold text-heading">
                  {t('common:jewellery-import-step-review')}
                </h2>
                <p className="mt-2 text-sm text-body">
                  {t('common:jewellery-import-job-status')}: {currentJob.status ?? '-'}
                </p>
              </div>
              <div className="flex gap-3">
                {currentJobId && (
                  <Button
                    variant="outline"
                    onClick={() => reportMutation.mutate(currentJobId)}
                    loading={reportMutation.isLoading}
                  >
                    {t('common:jewellery-import-download-report')}
                  </Button>
                )}
                <Button
                  onClick={handleCommit}
                  loading={commitMutation.isLoading}
                  disabled={!canConfirm}
                >
                  {t('common:jewellery-import-confirm')}
                </Button>
              </div>
            </div>

            {importCompleted ? (
              <Alert
                className="mb-5"
                variant="success"
                message={t('common:jewellery-import-completed')}
              />
            ) : importFailed ? (
              <Alert
                className="mb-5"
                variant="error"
                message={
                  currentStatus === 'expired'
                    ? t('common:jewellery-import-expired')
                    : currentJob.message ?? t('common:jewellery-import-failed')
                }
              />
            ) : hasBlockingErrors(currentJob) ? (
              <Alert
                className="mb-5"
                variant="warning"
                message={t('common:jewellery-import-blocking-errors')}
              />
            ) : (
              <Alert
                className="mb-5"
                variant="success"
                message={t('common:jewellery-import-ready')}
              />
            )}

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label={t('common:jewellery-import-total-rows')}
                value={counts.total_rows}
              />
              <SummaryCard
                label={t('common:jewellery-import-valid-rows')}
                value={counts.valid_rows}
              />
              <SummaryCard
                label={t('common:jewellery-import-invalid-rows')}
                value={counts.invalid_rows}
              />
              <SummaryCard
                label={t('common:jewellery-import-images')}
                value={counts.images_to_upload}
              />
              <SummaryCard
                label={t('common:jewellery-import-products-create')}
                value={counts.products_to_create}
              />
              <SummaryCard
                label={t('common:jewellery-import-products-update')}
                value={counts.products_to_update}
              />
              <SummaryCard
                label={t('common:jewellery-import-variants-create')}
                value={counts.variants_to_create}
              />
              <SummaryCard
                label={t('common:jewellery-import-variants-update')}
                value={counts.variants_to_update}
              />
            </div>

            {flatErrors.length ? (
              <div>
                <h3 className="mb-3 font-semibold text-heading">
                  {t('common:jewellery-import-row-errors')}
                </h3>
                <Table
                  columns={errorColumns}
                  data={flatErrors}
                  rowKey={(record: JewelleryImportError, index) =>
                    `${record.sheet ?? 'sheet'}-${record.row ?? index}-${record.code ?? index}`
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

JewelleryImportPage.authenticate = {
  permissions: adminAndOwnerOnly,
};
JewelleryImportPage.Layout = ShopLayout;

export const getServerSideProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ['table', 'common', 'form'])),
  },
});
