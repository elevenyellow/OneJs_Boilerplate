import type { UserRole } from '../types'
import { ensureRouteMeta } from '../utils/metadata'

export function Roles(...roles: (UserRole | string)[]) {
  return function (target: object, propertyKey: string) {
    const routeMeta = ensureRouteMeta(target, propertyKey)
    routeMeta.roles = roles
  }
}
