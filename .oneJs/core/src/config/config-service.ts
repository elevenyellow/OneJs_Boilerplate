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

  public get(key: string): string | undefined {
    return this.env[key]
  }

  private loadEnvFiles(): void {
    const envFiles = fs
      .readdirSync(rootDirectory)
      .filter((file: string) => file.endsWith('.env'))

    for (const file of envFiles) {
      this.loadEnvFile(path.join(rootDirectory, file))
    }

    this.logger.info(
      'OneJs:config',
      'All .env files from root loaded successfully.',
    )
  }

  private loadEnvFile(filePath: string): void {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n')
    for (const line of lines) {
      this.applyEnvLine(line)
    }
  }

  private applyEnvLine(line: string): void {
    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) return

    const key = line.slice(0, separatorIndex).trim()
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replaceAll("'", '')
      .replaceAll('"', '')

    if (!key || !value) return

    this.env[key] = value
    process.env[key] = value
  }
}
