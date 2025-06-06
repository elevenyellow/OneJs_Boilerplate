// lib/server-fetcher.ts
import { auth } from '@clerk/nextjs/server'

export async function serverFetcher<T = unknown>(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<T> {
  const { getToken } = await auth()
  const token = await getToken()

  const headers = {
    ...(init.headers || {}),
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const res = await fetch(input, { ...init, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw error
  }

  return res.json()
}
