export type ModuleRole =
  | 'controller'
  | 'handler'
  | 'provider'
  | 'middleware'
  | 'repository'

const roles = new Map<Function, Set<ModuleRole>>()

function roleMarker(role: ModuleRole): symbol {
  return Symbol.for(`onejs.role.${role}`)
}

export function markAs(ctor: Function, role: ModuleRole) {
  if (!roles.has(ctor)) roles.set(ctor, new Set())
  roles.get(ctor)!.add(role)
  ;(ctor as Function & Record<symbol, true>)[roleMarker(role)] = true
}

export function hasRole(ctor: Function, role: ModuleRole): boolean {
  return (
    roles.get(ctor)?.has(role) ??
    Boolean((ctor as Function & Record<symbol, true>)[roleMarker(role)])
  )
}

export function getRoles(ctor: Function): ModuleRole[] {
  const mappedRoles = new Set(roles.get(ctor) ?? [])
  for (const role of [
    'controller',
    'handler',
    'provider',
    'middleware',
    'repository',
  ] as const) {
    if ((ctor as Function & Record<symbol, true>)[roleMarker(role)]) {
      mappedRoles.add(role)
    }
  }
  return Array.from(mappedRoles)
}

export function clearMarkers() {
  roles.clear()
}
