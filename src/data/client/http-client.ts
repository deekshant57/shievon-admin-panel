import axios from 'axios';
import Cookies from 'js-cookie';
import Router from 'next/router';
import invariant from 'tiny-invariant';
import { AUTH_CRED } from '@/utils/constants';
import { API_ENDPOINTS } from './api-endpoints';

// Use the specified base URL, fallback to env variable if needed
const baseURL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:9000/api';

const Axios = axios.create({
  baseURL,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Use same cookie as setAuthCredentials/getAuthCredentials (AUTH_CRED) so token is sent after login
Axios.interceptors.request.use((config) => {
  const authCred = Cookies.get(AUTH_CRED);
  let token = '';
  if (authCred) {
    try {
      const parsed = JSON.parse(authCred);
      token = parsed?.token ?? '';
    } catch {
      token = '';
    }
  }
  // @ts-ignore
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`,
  };
  return config;
});

// Clear auth and reload only on explicit auth failures (401 or NOT_AUTHORIZED).
// Do not clear on 403 from validation/bad-request (e.g. missing type_id), so the user stays logged in.
Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const requestUrl = String(error.config?.url ?? '');
    const isLoginRequest = requestUrl.includes(API_ENDPOINTS.TOKEN);
    const isAuthFailure =
      (status === 401 && !isLoginRequest) ||
      (status === 403 && message === 'PICKBAZAR_ERROR.NOT_AUTHORIZED');
    if (isAuthFailure) {
      Cookies.remove(AUTH_CRED);
      Router.reload();
    }
    return Promise.reject(error);
  },
);

function formatBooleanSearchParam(key: string, value: boolean) {
  return value ? `${key}:1` : `${key}:`;
}

interface SearchParamOptions {
  categories: string;
  code: string;
  type: string;
  name: string;
  shop_id: string;
  is_approved: boolean;
  tracking_number: string;
  notice: string;
  notify_type: string;
  faq_title: string;
  is_active: boolean;
  title: string;
  status: string;
  user_id: string;
  target: string;
  refund_reason: string;
  shops: string;
  'users.id': string;
  product_type: string;
  is_read: boolean;
  transaction_identifier: string;
}

// Common API response wrapper used by the backend
interface ApiResponse<T> {
  code: number;
  status: boolean;
  message: string;
  data: T;
}

export class HttpClient {
  static async get<T>(url: string, params?: unknown): Promise<T> {
    // Filter out empty string values to avoid backend parsing issues
    const cleanedParams = params
      ? Object.fromEntries(
          Object.entries(params as Record<string, unknown>).filter(
            ([, value]) => value !== '' && value !== null && value !== undefined
          )
        )
      : params;
    const response = await Axios.get<ApiResponse<T>>(url, { params: cleanedParams });
    return response.data.data;
  }

  static async post<T>(url: string, data: unknown, options?: any): Promise<T> {
    // Log request body for create shop requests
    if (url === 'shops') {
      console.log('Create Shop Request Body:', JSON.stringify(data, null, 2));
    }
    const response = await Axios.post<ApiResponse<T>>(url, data, options);
    return response.data.data;
  }

  static async put<T>(url: string, data: unknown): Promise<T> {
    const response = await Axios.put<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  static async delete<T>(url: string): Promise<T> {
    const response = await Axios.delete<ApiResponse<T>>(url);
    return response.data.data;
  }

  static formatSearchParams(params: Partial<SearchParamOptions>) {
    return Object.entries(params)
      .filter(([, value]) => Boolean(value))
      .map(([k, v]) =>
        [
          'type',
          'categories',
          'tags',
          'author',
          'shops',
          'refund_reason',
        ].includes(k)
          ? `${k}.slug:${v}`
          : ['is_approved'].includes(k)
          ? formatBooleanSearchParam(k, v as boolean)
          : `${k}:${v}`,
      )
      .join(';');
  }
}

const THROTTLE_FALLBACK_MESSAGE = 'Please wait a moment and try again.';

function isThrottleError(status?: number, message?: string) {
  if (status === 429) return true;
  if (!message) return false;
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes('throttlerexception') ||
    normalizedMessage.includes('too many requests')
  );
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string | null = 'Something went wrong. Please try again.'
) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const status = error.response?.status;
  const message = error.response?.data?.message;
  if (isThrottleError(status, message)) {
    return THROTTLE_FALLBACK_MESSAGE;
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return fallbackMessage;
}

export function getFormErrors(error: unknown) {
  return getApiErrorMessage(error, null);
}

export function getFieldErrors(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data.errors;
  }
  return null;
}
