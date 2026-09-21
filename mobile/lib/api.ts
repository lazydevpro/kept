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
  type Payload = T & { error?: { code?: string; message?: string } }

  // An empty body is a legitimate answer (a 204), so it parses to `{}`. A body that is
  // present but is not JSON is not — it means something other than the API answered: a
  // proxy, a captive portal, a tunnel that dropped mid-request. That used to be caught
  // and returned as `{}` typed as `T`, so a 200 with the wrong body looked like a success
  // missing every field, and the Invest screen crashed to blank reading `assets.find`.
  const text = await response.text()
  let payload = {} as Payload
  let unreadable = false
  if (text) {
    try {
      payload = JSON.parse(text) as Payload
    } catch {
      unreadable = true
    }
  }

  if (!response.ok) {
    throw new ApiClientError(payload.error?.message ?? 'The request failed.', response.status, payload.error?.code)
  }
  if (unreadable) {
    throw new ApiClientError(
      'The server sent a response the app could not read.',
      response.status,
      'unreadable_response',
    )
  }
  return payload
}
