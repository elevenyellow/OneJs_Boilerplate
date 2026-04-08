import { useAuth } from '@clerk/nextjs'

export async function fetcher<T = unknown>(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<T> {
  const { getToken } = useAuth()
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
