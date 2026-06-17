// Core exports only

export {
  BootstrapBase,
  type BootstrapPlugin,
  Module,
  type ModuleOptions,
  OneJs,
  type Plugin,
  PluginRegistry,
} from './bootstrap'
export { ConfigService } from './config'
export {
  Container,
  ContainerProvider,
  container,
  Inject,
  Injectable,
  metadataRegistry,
} from './container'
export { Entity, ValueObject } from './domain/decorators'
export { Entity as EntityBase } from './domain/entity'
// Domain primitives
export { ValueObject as ValueObjectBase } from './domain/value-object'
export * from './errors'
export { Logger, logger } from './logger'
export {
  clearMarkers,
  getRoles,
  hasRole,
  type ModuleRole,
  markAs,
} from './markers'
export type { ClassConstructor } from './types'
