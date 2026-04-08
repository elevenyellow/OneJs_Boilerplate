export interface AutoLoaderOptions {
  rootDir: string
  extraDirs?: string[]
}

export interface IModuleLoader {
  load(options: AutoLoaderOptions): Promise<void>
}
