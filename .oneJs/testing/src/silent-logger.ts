import type { Logger } from '@OneJs/core'

/**
 * Silent Logger for testing - no console output
 */
export class SilentLogger implements Logger {
  debug(_scope: string, _message: string, ..._args: unknown[]): void {
    /* no-op: silent logger */
  }
  info(_scope: string, _message: string, ..._args: unknown[]): void {
    /* no-op: silent logger */
  }
  warn(_scope: string, _message: string, ..._args: unknown[]): void {
    /* no-op: silent logger */
  }
  error(_scope: string, _message: string, ..._args: unknown[]): void {
    /* no-op: silent logger */
  }
  trace(_scope: string, _message: string, ..._args: unknown[]): void {
    /* no-op: silent logger */
  }
}
