import type { Container } from '../container'
import { logger } from '../logger'

export interface Plugin {
  name: string
  priority?: number
  dependsOn?: string[]
  critical?: boolean
}

export interface BootstrapPlugin extends Plugin {
  register?(container: Container): Promise<void> | void
  load?(container: Container): Promise<void> | void
}

export class PluginRegistry {
  private static plugins: Plugin[] = []

  static register(plugin: Plugin): void {
    const alreadyRegistered = this.plugins.some((p) => p.name === plugin.name)
    if (alreadyRegistered) {
      logger.warn(
        'oneJs:plugin',
        `Plugin "${plugin.name}" is already registered. Skipping.`,
      )
      return
    }

    this.plugins.push(plugin)
    logger.debug('oneJs:plugin', `✅ Registered plugin: ${plugin.name}`)
  }

  static getAll(): Plugin[] {
    return this.resolve(this.plugins)
  }

  static getRegistered(): Plugin[] {
    return [...this.plugins]
  }

  static resolve(pluginList: Plugin[]): Plugin[] {
    const plugins = [...pluginList]
    const pluginNames = new Set(plugins.map((plugin) => plugin.name))

    for (const plugin of plugins) {
      for (const dependencyName of plugin.dependsOn ?? []) {
        if (!pluginNames.has(dependencyName)) {
          throw new Error(
            `Plugin "${plugin.name}" depends on "${dependencyName}", but it is not registered.`,
          )
        }
      }
    }

    const dependencyCount = new Map<string, number>()
    const dependents = new Map<string, string[]>()

    for (const plugin of plugins) {
      dependencyCount.set(plugin.name, plugin.dependsOn?.length ?? 0)
      dependents.set(plugin.name, [])
    }

    for (const plugin of plugins) {
      for (const dependencyName of plugin.dependsOn ?? []) {
        dependents.get(dependencyName)?.push(plugin.name)
      }
    }

    const getSortWeight = (plugin: Plugin): [number, string] => [
      plugin.priority ?? 100,
      plugin.name,
    ]

    const ready: Plugin[] = plugins
      .filter((plugin) => (dependencyCount.get(plugin.name) ?? 0) === 0)
      .sort((a, b) => {
        const [aPriority, aName] = getSortWeight(a)
        const [bPriority, bName] = getSortWeight(b)
        if (aPriority !== bPriority) return aPriority - bPriority
        return aName.localeCompare(bName)
      })

    const ordered: Plugin[] = []

    while (ready.length > 0) {
      const current = ready.shift()!
      ordered.push(current)

      for (const dependentName of dependents.get(current.name) ?? []) {
        const nextCount = (dependencyCount.get(dependentName) ?? 0) - 1
        dependencyCount.set(dependentName, nextCount)

        if (nextCount === 0) {
          const dependentPlugin = plugins.find(
            (plugin) => plugin.name === dependentName,
          )
          if (!dependentPlugin) continue

          ready.push(dependentPlugin)
          ready.sort((a, b) => {
            const [aPriority, aName] = getSortWeight(a)
            const [bPriority, bName] = getSortWeight(b)
            if (aPriority !== bPriority) return aPriority - bPriority
            return aName.localeCompare(bName)
          })
        }
      }
    }

    if (ordered.length !== plugins.length) {
      const blocked = plugins
        .filter((plugin) => (dependencyCount.get(plugin.name) ?? 0) > 0)
        .map((plugin) => plugin.name)
      throw new Error(
        `Circular plugin dependency detected among: ${blocked.join(', ')}`,
      )
    }

    return ordered
  }

  static clear(): void {
    this.plugins = []
  }
}
