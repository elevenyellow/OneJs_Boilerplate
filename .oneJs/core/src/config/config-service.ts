import fs from 'fs'
import path from 'path'
import { Inject, Injectable } from '../container'
import { Logger } from '../logger'

const rootDirectory = process.env.PROJECT_ROOT || process.cwd()

@Injectable()
export class ConfigService {
  private env: { [key: string]: string | undefined }

  constructor(@Inject(Logger) private readonly logger: Logger) {
    this.env = { ...process.env }
    this.loadEnvFiles()
  }

  private splitFirstOccurrence(str, separator) {
    const index = str.indexOf(separator)

    if (index === -1) {
      // Si el separador no se encuentra, devolver el string original en un array
      return [str]
    }

    // Dividir la cadena en dos partes
    const firstPart = str.slice(0, index)
    const secondPart = str.slice(index + separator.length)

    return [firstPart, secondPart]
  }

  private loadEnvFiles(): void {
    const envFiles = fs.readdirSync(rootDirectory)

    envFiles
      .filter((file) => file.endsWith('.env'))
      .forEach((file) => {
        const filePath = path.join(rootDirectory, file)
        const envVariables = fs.readFileSync(filePath, 'utf-8').split('\n')

        envVariables.forEach((variable) => {
          const [key, value] = this.splitFirstOccurrence(variable, '=')

          if (key && value)
            this.env[key.trim()] = value
              .trim()
              .replaceAll("'", '')
              .replaceAll('"', '')
        })
      })

    this.logger.info(
      'OneJs:config',
      'All .env files from root loaded successfully.',
    )
  }

  public get(key: string): string | undefined {
    return this.env[key]
  }
}
