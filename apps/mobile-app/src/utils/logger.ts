/**
 * Development-only logger utility
 *
 * Uses React Native's __DEV__ global flag to conditionally log.
 * In production builds, __DEV__ is false and logs are no-ops.
 *
 * @example
 * import { devLog } from '@/utils/logger'
 *
 * devLog.log('📍 Location:', location)
 * devLog.warn('⚠️ Warning message')
 * devLog.error('❌ Error:', error)
 */
export const devLog = {
  log: (...args: unknown[]): void => {
    if (__DEV__) {
      console.log(...args)
    }
  },
  warn: (...args: unknown[]): void => {
    if (__DEV__) {
      console.warn(...args)
    }
  },
  error: (...args: unknown[]): void => {
    if (__DEV__) {
      console.error(...args)
    }
  },
}
