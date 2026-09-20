import { authClient } from './auth-client'
import { AppConfig } from '@/constants/app-config'

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code = 'request_failed',
  ) {
    super(message)
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const cookie = await authClient.getCookie()
  const headers = new Headers(init?.headers)
  headers.set('accept', 'application/json')
  if (init?.body) headers.set('content-type', 'application/json')
  if (cookie) headers.set('cookie', cookie)
  const response = await fetch(`${AppConfig.apiUrl}${path}`, {
    ...init,
    credentials: init?.credentials ?? 'include',
    headers,
  })
  const payload = (await response.json().catch(() => ({}))) as T & { error?: { code?: string; message?: string } }
  if (!response.ok) {
    throw new ApiClientError(payload.error?.message ?? 'The request failed.', response.status, payload.error?.code)
  }
  return payload
}
