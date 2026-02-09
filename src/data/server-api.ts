/**
 * Server-side API fetcher for use in getServerSideProps.
 * Fetches from the REST API using the auth token from request cookies,
 * so page data comes from the API endpoints (DB) and not from static JSON.
 */
import type { GetServerSidePropsContext } from 'next'
import { API_ENDPOINTS } from './client/api-endpoints'
import type { UserPaginator } from '@/types'
import { AUTH_CRED } from '@/utils/constants'

const baseURL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:9000/api'

interface ApiResponse<T> {
  code: number
  status: boolean
  message: string
  data: T
}

function getTokenFromRequest(context: GetServerSidePropsContext): string {
  const cookie = context.req.cookies[AUTH_CRED]
  if (!cookie) return ''
  try {
    const parsed = JSON.parse(cookie) as { token?: string }
    return parsed?.token ?? ''
  } catch {
    return ''
  }
}

function buildUrl(endpoint: string, params: Record<string, unknown>): string {
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  const base = baseURL.replace(/\/$/, '')
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      searchParams.set(key, String(value))
    }
  })
  const qs = searchParams.toString()
  return `${base}/${path}${qs ? `?${qs}` : ''}`
}

export async function fetchUsersFromApi(
  context: GetServerSidePropsContext,
  params: Record<string, unknown> = {}
): Promise<UserPaginator | null> {
  const token = getTokenFromRequest(context)
  // Swagger GET /api/users: orderBy, sortedBy, text, search, first, limit, page
  const defaultParams = {
    orderBy: 'created_at',
    sortedBy: 'desc',
    limit: 20,
    page: 1,
    ...params,
  }
  const url = buildUrl(API_ENDPOINTS.USERS, defaultParams)
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResponse<UserPaginator>
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function fetchAdminsFromApi(
  context: GetServerSidePropsContext,
  params: Record<string, unknown> = {}
): Promise<UserPaginator | null> {
  const token = getTokenFromRequest(context)
  // Swagger GET /api/admin/list: orderBy, sortedBy, text, search, first, limit, page
  const defaultParams = {
    orderBy: 'created_at',
    sortedBy: 'desc',
    limit: 20,
    page: 1,
    ...params,
  }
  const url = buildUrl(API_ENDPOINTS.ADMIN_LIST, defaultParams)
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResponse<UserPaginator>
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function fetchVendorsFromApi(
  context: GetServerSidePropsContext,
  params: Record<string, unknown> & { is_active?: boolean } = {}
): Promise<UserPaginator | null> {
  const token = getTokenFromRequest(context)
  // Swagger GET /api/vendors/list: orderBy, sortedBy, text, search, first, limit, page (+ is_active)
  const defaultParams = {
    orderBy: 'created_at',
    sortedBy: 'desc',
    limit: 20,
    page: 1,
    ...params,
  }
  const url = buildUrl(API_ENDPOINTS.VENDORS_LIST, defaultParams)
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResponse<UserPaginator>
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function fetchCustomersFromApi(
  context: GetServerSidePropsContext,
  params: Record<string, unknown> = {}
): Promise<UserPaginator | null> {
  const token = getTokenFromRequest(context)
  // Swagger GET /api/customers/list: orderBy, sortedBy, text, search, first, limit, page
  const defaultParams = {
    orderBy: 'created_at',
    sortedBy: 'desc',
    limit: 20,
    page: 1,
    ...params,
  }
  const url = buildUrl(API_ENDPOINTS.CUSTOMERS, defaultParams)
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResponse<UserPaginator>
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function fetchMyStaffsFromApi(
  context: GetServerSidePropsContext,
  params: Record<string, unknown> = {}
): Promise<UserPaginator | null> {
  const token = getTokenFromRequest(context)
  // Swagger GET /api/my-staffs: orderBy, sortedBy, text, search, first, limit, page
  const defaultParams = {
    orderBy: 'created_at',
    sortedBy: 'desc',
    limit: 20,
    page: 1,
    is_active: true,
    ...params,
  }
  const url = buildUrl(API_ENDPOINTS.MY_STAFFS, defaultParams)
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResponse<UserPaginator>
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function fetchAllStaffsFromApi(
  context: GetServerSidePropsContext,
  params: Record<string, unknown> = {}
): Promise<UserPaginator | null> {
  const token = getTokenFromRequest(context)
  // Swagger GET /api/all-staffs: orderBy, sortedBy, text, search, first, limit, page
  const defaultParams = {
    orderBy: 'created_at',
    sortedBy: 'desc',
    limit: 20,
    page: 1,
    is_active: true,
    ...params,
  }
  const url = buildUrl(API_ENDPOINTS.ALL_STAFFS, defaultParams)
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResponse<UserPaginator>
    return json?.data ?? null
  } catch {
    return null
  }
}
