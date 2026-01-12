/**
 * Comando: test-s3-upload
 * Prueba de subida de imágenes a S3
 *
 * Este test verifica:
 * - Conexión a S3 funciona correctamente
 * - Descarga de imagen desde TheCrag
 * - Procesamiento con sharp (resize + WebP)
 * - Subida a S3 de ambas variantes (mobile y full)
 */

import { PrismaClientOneJs } from '@OneJs/core'
import { ImageProcessorService, S3StorageService } from '@storage/index'

export async function testS3Upload(container: unknown) {
  const dic = container as { get: <T>(token: unknown) => T }

  console.log('🧪 TEST S3 UPLOAD - Verificación de subida de imágenes a S3')
  console.log('='.repeat(80))
  console.log('')

  // Get services from container
  const s3Storage = dic.get<S3StorageService>(S3StorageService)
  const imageProcessor = dic.get<ImageProcessorService>(ImageProcessorService)
  const prisma = dic.get<PrismaClientOneJs>(PrismaClientOneJs)

  // Step 1: Check S3 configuration
  console.log('📍 Step 1: Verificando configuración de S3...')
  if (!s3Storage.isConfigured()) {
    console.error(
      '❌ S3 no está configurado. Verifica las variables de entorno:',
    )
    console.error('   - AWS_S3_BUCKET')
    console.error('   - AWS_S3_REGION')
    console.error('   - AWS_ACCESS_KEY_ID')
    console.error('   - AWS_SECRET_ACCESS_KEY')
    console.error('')
    console.error('Copia .env.example a .env y configura las variables.')
    return
  }
  console.log('   ✅ S3 configurado correctamente')
  console.log('')

  // Step 2: Find a crag with headerImageUrl
  console.log('📍 Step 2: Buscando un crag con imagen de cabecera...')
  const crag = await prisma.crag.findFirst({
    where: {
      headerImageUrl: { not: null },
    },
    select: {
      id: true,
      name: true,
      headerImageUrl: true,
      headerImageS3Url: true,
      headerImageS3UrlFull: true,
    },
  })

  if (!crag || !crag.headerImageUrl) {
    console.error('❌ No se encontró ningún crag con imagen de cabecera.')
    console.error('   Ejecuta primero un comando de scraping (ej: test-cheste)')
    return
  }

  console.log(`   ✅ Crag encontrado: ${crag.name}`)
  console.log(`   📷 URL original: ${crag.headerImageUrl}`)
  console.log('')

  // Step 3: Process and upload image
  console.log('📍 Step 3: Procesando y subiendo imagen a S3...')
  console.log('   - Descargando imagen original...')
  console.log('   - Creando versión mobile (800px, WebP 85%)...')
  console.log('   - Creando versión full (original, WebP 90%)...')
  console.log('   - Subiendo a S3...')
  console.log('')

  const startTime = Date.now()

  try {
    const result = await imageProcessor.processAndUpload(
      crag.headerImageUrl,
      'crag-header',
      crag.id,
    )

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('   ✅ ¡Imagen subida exitosamente!')
    console.log('')
    console.log('📊 RESULTADO:')
    console.log(`   Tiempo total: ${duration}s`)
    console.log('')
    console.log('   📱 Versión Mobile (800px):')
    console.log(`      URL: ${result.mobile.url}`)
    console.log(`      Tamaño: ${result.mobile.width}x${result.mobile.height}`)
    console.log(`      Peso: ${(result.mobile.size / 1024).toFixed(1)} KB`)
    console.log('')
    console.log('   🖥️  Versión Full:')
    console.log(`      URL: ${result.full.url}`)
    console.log(`      Tamaño: ${result.full.width}x${result.full.height}`)
    console.log(`      Peso: ${(result.full.size / 1024).toFixed(1)} KB`)
    console.log('')
    console.log(`   🔗 URL Original: ${result.originalUrl}`)
    console.log('')

    // Step 4: Update database with S3 URLs
    console.log('📍 Step 4: Actualizando base de datos con URLs de S3...')
    await prisma.crag.update({
      where: { id: crag.id },
      data: {
        headerImageS3Url: result.mobile.url,
        headerImageS3UrlFull: result.full.url,
        headerImageOriginalUrl: crag.headerImageUrl,
      },
    })
    console.log('   ✅ Base de datos actualizada')
    console.log('')

    // Step 5: Verify images exist in S3
    console.log('📍 Step 5: Verificando que las imágenes existen en S3...')
    const exists = await imageProcessor.imagesExist('crag-header', crag.id)
    if (exists) {
      console.log('   ✅ Las imágenes existen en S3')
    } else {
      console.log('   ⚠️ No se pudieron verificar las imágenes en S3')
    }
    console.log('')

    console.log('='.repeat(80))
    console.log('🎉 TEST COMPLETADO EXITOSAMENTE')
    console.log('='.repeat(80))
    console.log('')
    console.log('Las imágenes están disponibles en:')
    console.log(`   Mobile: ${result.mobile.url}`)
    console.log(`   Full: ${result.full.url}`)
    console.log('')
  } catch (error: unknown) {
    const err = error as Error
    console.error('')
    console.error('❌ Error subiendo imagen a S3:')
    console.error(`   ${err.message}`)
    console.error('')
    console.error('Verifica:')
    console.error('   1. Las credenciales de AWS son correctas')
    console.error('   2. El bucket existe y tienes permisos de escritura')
    console.error('   3. La imagen original es accesible')
    console.error('')
    if (err.stack) {
      console.error('Stack trace:')
      console.error(err.stack)
    }
    throw error
  }
}
