export type ClassConstructor<T = any> = new (...args: any[]) => T
export type Scope = 'singleton' | 'transient'
export type Fallback = (() => any) | any
