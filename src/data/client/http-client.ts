import axios from 'axios';
import Cookies from 'js-cookie';
import Router from 'next/router';
import invariant from 'tiny-invariant';

// Use the specified base URL, fallback to env variable if needed
const baseURL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:9000/api';

const Axios = axios.create({
  baseURL,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Change request data/error
const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? 'authToken';
Axios.interceptors.request.use((config) => {
  const cookies = Cookies.get(AUTH_TOKEN_KEY);
  let token = '';
  if (cookies) {
    token = JSON.parse(cookies)['token'];
  }
  // @ts-ignore
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`,
  };
  return config;
});

// Change response data/error here
Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      (error.response && error.response.status === 401) ||
      (error.response && error.response.status === 403) ||
      (error.response &&
        error.response.data.message === 'PICKBAZAR_ERROR.NOT_AUTHORIZED')
    ) {
      Cookies.remove(AUTH_TOKEN_KEY);
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
          'manufacturer',
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

export function getFormErrors(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data.message;
  }
  return null;
}

export function getFieldErrors(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data.errors;
  }
  return null;
}
