import type { Logger } from '@OneJs/core'

/**
 * Silent Logger for testing - no console output
 */
export class SilentLogger implements Logger {
  debug(_scope: string, _message: string, ..._args: any[]): void {}
  info(_scope: string, _message: string, ..._args: any[]): void {}
  warn(_scope: string, _message: string, ..._args: any[]): void {}
  error(_scope: string, _message: string, ..._args: any[]): void {}
  trace(_scope: string, _message: string, ..._args: any[]): void {}
}
