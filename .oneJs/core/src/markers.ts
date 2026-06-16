export type ModuleRole =
  | 'controller'
  | 'handler'
  | 'provider'
  | 'middleware'
  | 'repository'

const roles = new Map<Function, Set<ModuleRole>>()

export function markAs(ctor: Function, role: ModuleRole) {
  if (!roles.has(ctor)) roles.set(ctor, new Set())
  roles.get(ctor)!.add(role)
}

export function hasRole(ctor: Function, role: ModuleRole): boolean {
  return roles.get(ctor)?.has(role) ?? false
}

export function getRoles(ctor: Function): ModuleRole[] {
  return Array.from(roles.get(ctor) ?? [])
}

export function clearMarkers() {
  roles.clear()
}
