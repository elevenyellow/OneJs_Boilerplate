import type { Container } from './container'

/**
 * ContainerProvider provides a global access point to the DI container
 * using a provider pattern instead of direct singleton usage.
 * This allows for better testability and flexibility.
 */
export class ContainerProvider {
  private static instance: Container | null = null

  /**
   * Set the container instance to be used throughout the application
   */
  static setContainer(container: Container): void {
    this.instance = container
  }

  /**
   * Get the current container instance
   * @throws Error if container has not been set
   */
  static getContainer(): Container {
    if (!this.instance) {
      throw new Error(
        'Container not initialized. Call ContainerProvider.setContainer() first.',
      )
    }
    return this.instance
  }

  /**
   * Check if a container has been set
   */
  static hasContainer(): boolean {
    return this.instance !== null
  }

  /**
   * Clear the container (useful for testing)
   */
  static clear(): void {
    this.instance = null
  }
}
