#!/usr/bin/env node

import { Command } from 'commander'
import { AppGenerator } from './app-generator'
import path from 'path'

const program = new Command()

program
  .name('create-app')
  .description('CLI to generate a hexagonal folder structure for a new app')
  .argument('<folderName>', 'Name of the application folder')
  .option('-p, --path <basePath>', 'Base path to create the app in', 'src/apps')
  .action((folderName, options) => {
    const basePath = path.resolve(options.path)
    const generator = new AppGenerator(folderName, basePath)
    generator.generate()
  })

// Solo ejecuta el CLI si es invocado directamente desde la terminal
if (require.main === module) {
  program.parse()
}
