/**
 * Auth Token Configuration
 * 
 * This module provides a way to access Clerk's getToken function
 * from outside React components (e.g., in API client).
 */

type GetTokenFunction = (options?: { template?: string }) => Promise<string | null>

let getTokenFunction: GetTokenFunction | null = null

/**
 * Set the getToken function from Clerk's useAuth hook
 * This should be called from within a React component that has access to useAuth()
 */
export function setGetTokenFunction(fn: GetTokenFunction | null): void {
  getTokenFunction = fn
}

/**
 * Get the authentication token
 * This can be called from anywhere, including outside React components
 * 
 * @returns Promise that resolves to the JWT token or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  if (!getTokenFunction) {
    console.warn('[authToken] getToken function not set. Make sure Clerk is initialized.')
    return null
  }

  try {
    const token = await getTokenFunction()
    return token
  } catch (error) {
    console.error('[authToken] Error getting token:', error)
    return null
  }
}

/**
 * Check if the getToken function is available
 */
export function isAuthTokenAvailable(): boolean {
  return getTokenFunction !== null
}
