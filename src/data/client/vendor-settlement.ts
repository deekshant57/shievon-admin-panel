import {
  PaymentInfo,
  PaymentInfoInput,
  VendorSettlementSummary,
} from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { HttpClient } from './http-client';

export const vendorSettlementClient = {
  get(shopId: string | number) {
    return HttpClient.get<VendorSettlementSummary>(
      `${API_ENDPOINTS.VENDOR_SETTLEMENTS}/${shopId}`,
    );
  },
  updatePaymentInfo(shopId: string | number, data: PaymentInfoInput) {
    return HttpClient.post<PaymentInfo>(
      `${API_ENDPOINTS.VENDOR_SETTLEMENTS}/${shopId}/payment-info`,
      data,
    );
  },
  verifyPaymentInfo(shopId: string | number) {
    return HttpClient.post<PaymentInfo>(
      `${API_ENDPOINTS.VENDOR_SETTLEMENTS}/${shopId}/payment-info/verify`,
      {},
    );
  },
};
