import type { Type } from '@/types'

const SERVICE_TYPE_NAMES = ['cafe', 'salon']
const SERVICE_TYPE_SLUGS = ['cafe', 'salon']

function normalize(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

export function isServiceType(type: Partial<Type> | null | undefined): boolean {
  const name = normalize((type as any)?.name)
  const slug = normalize((type as any)?.slug)
  return SERVICE_TYPE_NAMES.includes(name) || SERVICE_TYPE_SLUGS.includes(slug)
}

export function isServiceTypeName(name: unknown): boolean {
  return SERVICE_TYPE_NAMES.includes(normalize(name))
}

