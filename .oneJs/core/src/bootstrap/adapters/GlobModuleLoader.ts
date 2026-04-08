import { fileURLToPath } from 'url'
import path from 'path'
import { glob } from 'glob'
import { logger } from '../../logger'
import type { IModuleLoader, AutoLoaderOptions } from '../ports/IModuleLoader'

const ignorePatterns = [
  '**/*.spec.{ts,js}',
  '**/*.test.{ts,js}',
  '**/__test__/**',
  '**/__tests__/**',
  '**/node_modules/**',
  '**/auto-load/**',
  '**/create-app/**',
]

function isInsideAllowedDirs(filePath: string, allowedDirs: string[]): boolean {
  const normalizedFile = path.normalize(filePath)
  return allowedDirs.some((dir) =>
    normalizedFile.startsWith(path.normalize(dir)),
  )
}

async function importMatchingFiles(
  pattern: string,
  allowedDirs?: string[],
): Promise<void> {
  const files = await glob(pattern, { ignore: ignorePatterns, nodir: true })

  for (const file of files) {
    const resolvedPath = path.resolve(file)

    if (allowedDirs && !isInsideAllowedDirs(resolvedPath, allowedDirs)) {
      logger.debug('oneJs:loader', `🚫 Skipped: ${resolvedPath}`)
      continue
    }

    try {
      await import(resolvedPath)
    } catch (err) {
      logger.warn('oneJs:loader', `⚠️ Failed to import ${resolvedPath}: ${err}`)
    }
  }
}

async function loadCoreFiles(): Promise<void> {
  const currentDir = fileURLToPath(new URL('.', import.meta.url))
  const corePattern = path.resolve(currentDir, '../../*.{ts,js}')
  await importMatchingFiles(corePattern)
}

async function loadApplicationFiles(
  rootDir: string,
  extraDirs: string[],
): Promise<void> {
  const allowedDirs = [rootDir, ...extraDirs]

  for (const dir of allowedDirs) {
    const pattern = path.resolve(dir, '**/*.{ts,js}')
    await importMatchingFiles(pattern, allowedDirs)
  }
}

export class GlobModuleLoader implements IModuleLoader {
  async load(options: AutoLoaderOptions): Promise<void> {
    await loadCoreFiles()
    await loadApplicationFiles(options.rootDir, options.extraDirs ?? [])
  }
}
