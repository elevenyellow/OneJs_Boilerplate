export type ClassConstructor<T = unknown> = new (...args: never[]) => T
export type Scope = 'singleton' | 'transient'
export type Fallback = (() => unknown) | unknown
