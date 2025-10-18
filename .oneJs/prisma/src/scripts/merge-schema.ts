import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🧭 Obtener la raíz del proyecto (donde está el package.json o el cwd)
const projectRoot = process.cwd()

function assertFileExists(filePath, label) {
  if (!existsSync(filePath)) {
    console.error(`❌ ERROR: Didn't find "${label}" in:\n   ${filePath}`)
    process.exit(1)
  }
}

try {
  // 🔍 Buscar archivos base en el mismo directorio que el script
  const generatorFile = path.resolve(__dirname, './generators.prisma')
  const datasourceFile = path.resolve(__dirname, './datasource.prisma')

  // ✅ Verificar archivos obligatorios
  assertFileExists(generatorFile, 'generators.prisma')
  assertFileExists(datasourceFile, 'datasource.prisma')

  // 🧩 Buscar modelos dinámicos en TODO el proyecto
  const modelFiles = globSync(path.resolve(projectRoot, '**/*.model.prisma'), {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  })

  if (modelFiles.length === 0) {
    console.warn("⚠️  Didn't find any *.model.prisma in the project.")
  } else {
    console.log(`🔍 Found ${modelFiles.length} models.`)
  }

  // 📚 Leer contenido
  const generator = readFileSync(generatorFile, 'utf-8').trim()
  const datasource = readFileSync(datasourceFile, 'utf-8').trim()

  const models = modelFiles
    .map((f) => readFileSync(f, 'utf-8').trim())
    .join('\n\n')

  // 🧱 Concatenar en orden
  const merged = [generator, datasource, models].filter(Boolean).join('\n\n\n')

  // 📦 Salida en la raíz del proyecto
  const outputDir = path.resolve(projectRoot, 'prisma')
  const outputPath = path.resolve(outputDir, 'schema.prisma')

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
    console.log(`📁 Folder created: ${outputDir}`)
  }

  // 💾 Escribir resultado
  writeFileSync(outputPath, merged)
  console.log(`✅ schema.prisma generated correctly in:\n   ${outputPath}`)
  console.log(`📦 Models included: ${modelFiles.length}`)
} catch (err) {
  console.error('❌ Error generating schema.prisma:', err)
  process.exit(1)
}
