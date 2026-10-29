import { HttpClient } from './http-client';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
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

export const importClient = {
  importCsv: async (url: string, variables: any) => {
    let formData = new FormData();
    formData.append('csv', variables?.csv);
    formData.append('shop_id', variables?.shop_id);
    const options = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    const response = await HttpClient.post<any>(url, formData, options);
    return response.data;
  },
  downloadClothingTemplate: async (input: ClothingImportTemplateInput) => {
    return HttpClient.getBlob(API_ENDPOINTS.CLOTHING_IMPORT_TEMPLATE, {
      shopId: input.shopId,
      shop_id: input.shopId,
      ...(input.segment ? { segment: input.segment } : {}),
      ...(input.categoryId
        ? { categoryId: input.categoryId, category_id: input.categoryId }
        : {}),
    });
  },
  previewClothingImport: async (input: ClothingImportPreviewInput) => {
    const formData = new FormData();
    formData.append('xlsx', input.xlsx);
    formData.append('zip', input.zip);
    formData.append('shopId', String(input.shopId));
    if (input.categoryId) {
      formData.append('categoryId', String(input.categoryId));
    }
    if (input.segment) {
      formData.append('segment', input.segment);
    }
    if (input.templateVersion) {
      formData.append('templateVersion', input.templateVersion);
    }

    return HttpClient.post<ClothingImportJob>(
      API_ENDPOINTS.CLOTHING_IMPORT_PREVIEW,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  getClothingImportJob: async (jobId: string | number) => {
    return HttpClient.get<ClothingImportJob>(
      `${API_ENDPOINTS.CLOTHING_IMPORT_JOBS}/${jobId}`
    );
  },
  getClothingImportJobs: async (input: ClothingImportJobsInput) => {
    return HttpClient.get<ClothingImportJobsResponse>(
      API_ENDPOINTS.CLOTHING_IMPORT_JOBS,
      input
    );
  },
  commitClothingImport: async ({
    jobId,
    idempotencyKey,
  }: ClothingImportCommitInput) => {
    return HttpClient.post<ClothingImportJob>(
      `${API_ENDPOINTS.CLOTHING_IMPORT_JOBS}/${jobId}/commit`,
      { idempotencyKey }
    );
  },
  downloadClothingImportReport: async (jobId: string | number) => {
    return HttpClient.getBlob(
      `${API_ENDPOINTS.CLOTHING_IMPORT_JOBS}/${jobId}/report`
    );
  },
  downloadCosmeticsTemplate: async (input: CosmeticsImportTemplateInput) => {
    return HttpClient.getBlob(API_ENDPOINTS.COSMETICS_IMPORT_TEMPLATE, {
      shopId: input.shopId,
      shop_id: input.shopId,
    });
  },
  previewCosmeticsImport: async (input: CosmeticsImportPreviewInput) => {
    const formData = new FormData();
    formData.append('xlsx', input.xlsx);
    if (input.zip) {
      formData.append('zip', input.zip);
    }
    formData.append('shopId', String(input.shopId));

    return HttpClient.post<CosmeticsImportJob>(
      API_ENDPOINTS.COSMETICS_IMPORT_PREVIEW,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  getCosmeticsImportJob: async (jobId: string | number) => {
    return HttpClient.get<CosmeticsImportJob>(
      `${API_ENDPOINTS.COSMETICS_IMPORT_JOBS}/${jobId}`
    );
  },
  getCosmeticsImportJobs: async (input: CosmeticsImportJobsInput) => {
    return HttpClient.get<CosmeticsImportJob[]>(
      API_ENDPOINTS.COSMETICS_IMPORT_JOBS,
      input
    );
  },
  commitCosmeticsImport: async ({
    jobId,
    idempotencyKey,
    confirmedNearDuplicates,
  }: CosmeticsImportCommitInput) => {
    return HttpClient.post<CosmeticsImportJob>(
      `${API_ENDPOINTS.COSMETICS_IMPORT_JOBS}/${jobId}/commit`,
      { idempotencyKey, confirmedNearDuplicates }
    );
  },
  downloadCosmeticsImportReport: async (jobId: string | number) => {
    return HttpClient.getBlob(
      `${API_ENDPOINTS.COSMETICS_IMPORT_JOBS}/${jobId}/report`
    );
  },
  downloadFootwearTemplate: async (input: FootwearImportTemplateInput) => {
    return HttpClient.getBlob(API_ENDPOINTS.FOOTWEAR_IMPORT_TEMPLATE, {
      shopId: input.shopId,
      shop_id: input.shopId,
    });
  },
  previewFootwearImport: async (input: FootwearImportPreviewInput) => {
    const formData = new FormData();
    formData.append('xlsx', input.xlsx);
    formData.append('zip', input.zip);
    formData.append('shopId', String(input.shopId));

    return HttpClient.post<FootwearImportJob>(
      API_ENDPOINTS.FOOTWEAR_IMPORT_PREVIEW,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  getFootwearImportJob: async (jobId: string | number) => {
    return HttpClient.get<FootwearImportJob>(
      `${API_ENDPOINTS.FOOTWEAR_IMPORT_JOBS}/${jobId}`
    );
  },
  getFootwearImportJobs: async (input: FootwearImportJobsInput) => {
    return HttpClient.get<FootwearImportJobsResponse>(
      API_ENDPOINTS.FOOTWEAR_IMPORT_JOBS,
      input
    );
  },
  commitFootwearImport: async ({
    jobId,
    idempotencyKey,
  }: FootwearImportCommitInput) => {
    return HttpClient.post<FootwearImportJob>(
      `${API_ENDPOINTS.FOOTWEAR_IMPORT_JOBS}/${jobId}/commit`,
      { idempotencyKey }
    );
  },
  downloadFootwearImportReport: async (jobId: string | number) => {
    return HttpClient.getBlob(
      `${API_ENDPOINTS.FOOTWEAR_IMPORT_JOBS}/${jobId}/report`
    );
  },
};
