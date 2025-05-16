import { container } from '../container'
import type { ClassConstructor } from '../types'

export interface InjectableOptions {
  scope?: 'singleton' | 'transient'
  autorun?: boolean
}

export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  const { scope = 'singleton', autorun = false } = options

  return (target: Function): void => {
    container.register(target as ClassConstructor<any>, scope, autorun)
  }
}
