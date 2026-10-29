import { useMutation, useQuery, useQueryClient } from 'react-query';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { getApiErrorMessage } from '@/data/client/http-client';
import { importClient } from '@/data/client/import';
import {
  ClothingImportCommitInput,
  CosmeticsImportCommitInput,
  CosmeticsImportJob,
  CosmeticsImportJobsInput,
  CosmeticsImportPreviewInput,
  CosmeticsImportTemplateInput,
  ClothingImportJob,
  ClothingImportJobsInput,
  ClothingImportJobsResponse,
  ClothingImportPreviewInput,
  ClothingImportTemplateInput,
  FootwearImportCommitInput,
  FootwearImportJob,
  FootwearImportJobsInput,
  FootwearImportJobsResponse,
  FootwearImportPreviewInput,
  FootwearImportTemplateInput,
} from '@/types';

type Input = {
  shop_id: string;
  csv: any;
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function normalizeClothingImportJobs(response?: ClothingImportJobsResponse) {
  if (Array.isArray(response)) return response;
  return response?.data ?? response?.jobs ?? [];
}

function normalizeFootwearImportJobs(response?: FootwearImportJobsResponse) {
  if (Array.isArray(response)) return response;
  return response?.data ?? response?.jobs ?? [];
}

export const useImportAttributesMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation(
    (input: Input) => {
      return importClient.importCsv(API_ENDPOINTS.IMPORT_ATTRIBUTES, input);
    },
    {
      onSuccess: () => {
        toast.success(t('common:attribute-imported-successfully'));
      },
      onError: (error: any) => {
        toast.error(t(`common:${error?.response?.data.message}`));
      },
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.ATTRIBUTES);
      },
    }
  );
};

export const useImportProductsMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation(
    (input: Input) => {
      return importClient.importCsv(API_ENDPOINTS.IMPORT_PRODUCTS, input);
    },
    {
      onSuccess: () => {
        toast.success(t('common:product-imported-successfully'));
      },
      onError: (error: any) => {
        toast.error(t(`common:${error?.response?.data.message}`));
      },
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
      },
    }
  );
};

export const useImportVariationOptionsMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation(
    (input: Input) => {
      return importClient.importCsv(
        API_ENDPOINTS.IMPORT_VARIATION_OPTIONS,
        input
      );
    },
    {
      onSuccess: () => {
        toast.success(t('common:variation-options-imported-successfully'));
      },
      onError: (error: any) => {
        toast.error(t(`common:${error?.response?.data.message}`));
      },
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
      },
    }
  );
};

export const useDownloadClothingTemplateMutation = () => {
  const { t } = useTranslation('common');

  return useMutation(
    (input: ClothingImportTemplateInput) =>
      importClient.downloadClothingTemplate(input),
    {
      onSuccess: (blob, variables) => {
        downloadBlob(
          blob,
          variables.categoryId
            ? `clothing-import-template-${variables.categoryId}.xlsx`
            : 'clothing-bulk-import-template.xlsx'
        );
      },
      onError: (error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) {
          toast.error(
            t('common:clothing-import-template-not-available') ||
              'Bulk import template API is not available yet. Please ask backend to enable GET /api/imports/clothing/template.'
          );
          return;
        }
        toast.error(
          getApiErrorMessage(
            error,
            t('common:clothing-import-template-download-failed')
          )
        );
      },
    }
  );
};

export const usePreviewClothingImportMutation = () => {
  const { t } = useTranslation('common');

  return useMutation(
    (input: ClothingImportPreviewInput) =>
      importClient.previewClothingImport(input),
    {
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ??
            t('common:clothing-import-preview-failed')
        );
      },
    }
  );
};

export const useClothingImportJobQuery = (
  jobId?: string | number,
  options: { enabled?: boolean; refetchInterval?: number | false } = {}
) => {
  const { data, error, isLoading, refetch } = useQuery<ClothingImportJob, Error>(
    [API_ENDPOINTS.CLOTHING_IMPORT_JOBS, jobId],
    () => importClient.getClothingImportJob(jobId as string | number),
    {
      enabled: Boolean(jobId) && (options.enabled ?? true),
      refetchInterval: options.refetchInterval,
    }
  );

  return {
    job: data,
    error,
    loading: isLoading,
    refetch,
  };
};

export const useClothingImportJobsQuery = (
  input?: ClothingImportJobsInput,
  options: { enabled?: boolean } = {}
) => {
  const { data, error, isLoading, refetch } = useQuery<
    ClothingImportJobsResponse,
    Error
  >(
    [API_ENDPOINTS.CLOTHING_IMPORT_JOBS, input],
    () => importClient.getClothingImportJobs(input as ClothingImportJobsInput),
    {
      enabled: Boolean(input?.shopId) && (options.enabled ?? true),
      retry: false,
    }
  );

  return {
    jobs: normalizeClothingImportJobs(data),
    error,
    loading: isLoading,
    refetch,
  };
};

export const useCommitClothingImportMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation(
    (input: ClothingImportCommitInput) =>
      importClient.commitClothingImport(input),
    {
      onSuccess: () => {
        toast.success(t('common:clothing-import-commit-started'));
        queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ??
            t('common:clothing-import-commit-failed')
        );
      },
    }
  );
};

export const useDownloadClothingImportReportMutation = () => {
  const { t } = useTranslation('common');

  return useMutation(
    (jobId: string | number) => importClient.downloadClothingImportReport(jobId),
    {
      onSuccess: (blob, jobId) => {
        downloadBlob(blob, `clothing-import-report-${jobId}.xlsx`);
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ??
            t('common:clothing-import-report-download-failed')
        );
      },
    }
  );
};

export const useDownloadFootwearTemplateMutation = () => {
  const { t } = useTranslation('common');

  return useMutation(
    (input: FootwearImportTemplateInput) =>
      importClient.downloadFootwearTemplate(input),
    {
      onSuccess: (blob) => {
        downloadBlob(blob, 'footwear-import-template.xlsx');
      },
      onError: (error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) {
          toast.error(
            t('common:footwear-import-template-not-available') ||
              'Bulk import template API is not available yet. Please ask backend to enable GET /api/imports/footwear/template.'
          );
          return;
        }
        toast.error(
          getApiErrorMessage(
            error,
            t('common:footwear-import-template-download-failed')
          )
        );
      },
    }
  );
};

export const usePreviewFootwearImportMutation = () => {
  const { t } = useTranslation('common');

  return useMutation(
    (input: FootwearImportPreviewInput) =>
      importClient.previewFootwearImport(input),
    {
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ??
            t('common:footwear-import-preview-failed')
        );
      },
    }
  );
};

export const useFootwearImportJobQuery = (
  jobId?: string | number,
  options: { enabled?: boolean; refetchInterval?: number | false } = {}
) => {
  const { data, error, isLoading, refetch } = useQuery<FootwearImportJob, Error>(
    [API_ENDPOINTS.FOOTWEAR_IMPORT_JOBS, jobId],
    () => importClient.getFootwearImportJob(jobId as string | number),
    {
      enabled: Boolean(jobId) && (options.enabled ?? true),
      refetchInterval: options.refetchInterval,
    }
  );

  return {
    job: data,
    error,
    loading: isLoading,
    refetch,
  };
};

export const useFootwearImportJobsQuery = (
  input?: FootwearImportJobsInput,
  options: { enabled?: boolean } = {}
) => {
  const { data, error, isLoading, refetch } = useQuery<
    FootwearImportJobsResponse,
    Error
  >(
    [API_ENDPOINTS.FOOTWEAR_IMPORT_JOBS, input],
    () => importClient.getFootwearImportJobs(input as FootwearImportJobsInput),
    {
      enabled: Boolean(input?.shopId) && (options.enabled ?? true),
      retry: false,
    }
  );

  return {
    jobs: normalizeFootwearImportJobs(data),
    error,
    loading: isLoading,
    refetch,
  };
};

export const useCommitFootwearImportMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation(
    (input: FootwearImportCommitInput) =>
      importClient.commitFootwearImport(input),
    {
      onSuccess: () => {
        toast.success(t('common:footwear-import-commit-started'));
        queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
        queryClient.invalidateQueries(API_ENDPOINTS.FOOTWEAR_IMPORT_JOBS);
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ??
            t('common:footwear-import-commit-failed')
        );
      },
    }
  );
};

export const useDownloadFootwearImportReportMutation = () => {
  const { t } = useTranslation('common');

  return useMutation(
    (jobId: string | number) => importClient.downloadFootwearImportReport(jobId),
    {
      onSuccess: (blob, jobId) => {
        downloadBlob(blob, `footwear-import-report-${jobId}.xlsx`);
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ??
            t('common:footwear-import-report-download-failed')
        );
      },
    }
  );
};

export const useDownloadCosmeticsTemplateMutation = () => {
  const { t } = useTranslation('common');

  return useMutation(
    (input: CosmeticsImportTemplateInput) =>
      importClient.downloadCosmeticsTemplate(input),
    {
      onSuccess: (blob) => {
        downloadBlob(blob, 'cosmetics-import-template.xlsx');
      },
      onError: (error: unknown) => {
        toast.error(
          getApiErrorMessage(
            error,
            t('common:cosmetics-import-template-download-failed')
          )
        );
      },
    }
  );
};

export const usePreviewCosmeticsImportMutation = () => {
  const { t } = useTranslation('common');

  return useMutation(
    (input: CosmeticsImportPreviewInput) =>
      importClient.previewCosmeticsImport(input),
    {
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ??
            t('common:cosmetics-import-preview-failed')
        );
      },
    }
  );
};

export const useCosmeticsImportJobQuery = (
  jobId?: string | number,
  options: { enabled?: boolean; refetchInterval?: number | false } = {}
) => {
  const { data, error, isLoading, refetch } = useQuery<
    CosmeticsImportJob,
    Error
  >(
    [API_ENDPOINTS.COSMETICS_IMPORT_JOBS, jobId],
    () => importClient.getCosmeticsImportJob(jobId as string | number),
    {
      enabled: Boolean(jobId) && (options.enabled ?? true),
      refetchInterval: options.refetchInterval,
    }
  );

  return {
    job: data,
    error,
    loading: isLoading,
    refetch,
  };
};

export const useCosmeticsImportJobsQuery = (
  input?: CosmeticsImportJobsInput,
  options: { enabled?: boolean } = {}
) => {
  const { data, error, isLoading, refetch } = useQuery<
    CosmeticsImportJob[],
    Error
  >(
    [API_ENDPOINTS.COSMETICS_IMPORT_JOBS, input],
    () => importClient.getCosmeticsImportJobs(input as CosmeticsImportJobsInput),
    {
      enabled: Boolean(input?.shopId) && (options.enabled ?? true),
      retry: false,
    }
  );

  return {
    jobs: Array.isArray(data) ? data : [],
    error,
    loading: isLoading,
    refetch,
  };
};

export const useCommitCosmeticsImportMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation(
    (input: CosmeticsImportCommitInput) =>
      importClient.commitCosmeticsImport(input),
    {
      onSuccess: () => {
        toast.success(t('common:cosmetics-import-commit-started'));
        queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS);
        queryClient.invalidateQueries(API_ENDPOINTS.COSMETICS_IMPORT_JOBS);
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ??
            t('common:cosmetics-import-commit-failed')
        );
      },
    }
  );
};

export const useDownloadCosmeticsImportReportMutation = () => {
  const { t } = useTranslation('common');

  return useMutation(
    (jobId: string | number) =>
      importClient.downloadCosmeticsImportReport(jobId),
    {
      onSuccess: (blob, jobId) => {
        downloadBlob(blob, `cosmetics-import-report-${jobId}.xlsx`);
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ??
            t('common:cosmetics-import-report-download-failed')
        );
      },
    }
  );
};
