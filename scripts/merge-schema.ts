import { writeFileSync, readFileSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const generatorFile = path.resolve(__dirname, '../prisma/generators.prisma')
const datasourceFile = path.resolve(__dirname, '../prisma/datasource.prisma')

const dynamicFiles = globSync(
  path.resolve(
    __dirname,
    '../apps/**/infrastructure/persistence/prisma/*.model.prisma',
  ),
)

const commonFiles = globSync(
  path.resolve(
    __dirname,
    '../packages/**/infrastructure/persistence/prisma/*.model.prisma',
  ),
)

const modelFiles = [...dynamicFiles, ...commonFiles]

if (modelFiles.length === 0) {
  console.error('❌ No model files found to merge.')
  process.exit(1)
}

// Leer contenido
const generator = readFileSync(generatorFile, 'utf-8').trim()
const datasource = readFileSync(datasourceFile, 'utf-8').trim()
const models = modelFiles
  .map((f) => readFileSync(f, 'utf-8').trim())
  .join('\n\n')

// Concatenar en orden
const merged = [generator, datasource, models].join('\n\n\n')

// Escribir resultado
const outputPath = path.resolve(__dirname, '../prisma/schema.prisma')
writeFileSync(outputPath, merged)

console.log(`✅ schema.prisma generado con ${modelFiles.length} modelos.`)
