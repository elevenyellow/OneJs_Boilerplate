import { writeFileSync, readFileSync } from 'fs'
import { globSync } from 'glob'

const staticFiles = [
  './src/common/prisma/infrastructure/generators.prisma',
  './src/common/prisma/infrastructure/datasource.prisma',
]

const dynamicFiles = globSync(
  './src/apps/**/infrastructure/persistence/prisma/*.model.prisma',
)

const files = [...staticFiles, ...dynamicFiles]

const merged = files
  .map((f) => readFileSync(f, 'utf-8').trim() + '\n\n') // añade salto entre modelos
  .join('')

writeFileSync('schema.prisma', merged)

console.log(`✅ schema.prisma merged with ${files.length} files`)
