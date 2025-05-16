import glob from 'glob-promise'
import path from 'path'
import { container } from '../container'

export class AutoLoader {
  // Ignorar archivos de pruebas y ciertos directorios
  private static readonly ignorePatterns = [
    '**/*.spec.{ts,js}',
    '**/*.test.{ts,js}',
    '**/__test__/**',
    '**/__tests__/**',
    '**/node_modules/**',
    '**/auto-load/**',
    '**/create-app/**',
    '*.ts', // ✅ ignora raíz
    '*.js',
  ]

  /**
   * Inicializa el auto-loader cargando los módulos y ejecutando los métodos autorun
   */
  static async init(): Promise<void> {
    try {
      await this.loadCoreFiles()
      await this.loadApplicationFiles()
      await this.runAutoRunMethods()
    } catch (error) {
      console.error('❌ AutoLoader failed:', error)
    }
  }

  /**
   * Carga archivos base del core (ej: contenedor, configuración, etc.)
   */
  private static async loadCoreFiles(): Promise<void> {
    const corePattern = path.resolve(__dirname, '../*.{ts,js}')
    await this.importMatchingFiles(corePattern)
  }

  /**
   * Carga todos los archivos de la aplicación que cumplen el patrón
   */
  private static async loadApplicationFiles(): Promise<void> {
    // Solo carga archivos de ciertos subdirectorios
    const subfolders = ['src', 'apps', 'packages', 'modules']
    for (const folder of subfolders) {
      const pattern = path.resolve(process.cwd(), folder, '**/*.{ts,js}')
      await this.importMatchingFiles(pattern)
    }
  }

  /**
   * Importa dinámicamente todos los archivos que cumplan el patrón dado,
   * ignorando los definidos en ignorePatterns
   */
  private static async importMatchingFiles(pattern: string): Promise<void> {
    const files = await glob(pattern, {
      ignore: this.ignorePatterns,
      nodir: true,
    })

    for (const file of files) {
      try {
        await import(path.resolve(file)) // Ejecuta decoradores o inicializadores
        // console.debug(`📦 Imported: ${file}`)
      } catch (err) {
        console.warn(`⚠️ Failed to import ${file}: ${err}`)
      }
    }
  }

  /**
   * Ejecuta los métodos `autorun()` definidos en servicios registrados
   */
  private static async runAutoRunMethods(): Promise<void> {
    const services = container.getAllServicesWithAutorun()

    for (const Service of services) {
      const instance = container.get(Service)
      if (typeof instance.autorun === 'function') {
        console.info(`⚙️ Running autorun => ${Service.name}`)
        try {
          await instance.autorun()
        } catch (err) {
          console.error(`❌ autorun failed for ${Service.name}:`, err)
        }
      }
    }
  }
}
