/**
 * Comando: fix-crag-coordinates
 * Actualiza las coordenadas de los crags que no las tienen
 * extrayendo del campo beta (approach text) que ya está guardado
 */

import { PrismaClientOneJs } from '@OneJs/prisma'

export async function fixCragCoordinates(container: any) {
  const prisma = container.get(PrismaClientOneJs) as PrismaClientOneJs

  console.log('🔧 FIX CRAG COORDINATES')
  console.log('='.repeat(60))
  console.log('')
  console.log('Buscando crags sin coordenadas...')

  // Find crags without coordinates
  const cragsWithoutCoords = await prisma.crag.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      approach: true,
      description: true,
      apiResponseRaw: true,
    },
  })

  console.log(`Encontrados ${cragsWithoutCoords.length} crags sin coordenadas\n`)

  let updated = 0
  let failed = 0

  for (const crag of cragsWithoutCoords) {
    console.log(`📍 Procesando: ${crag.name}`)

    // Try to extract coordinates from approach text
    const coords = extractCoordsFromText(crag.approach, crag.description, crag.apiResponseRaw)

    if (coords) {
      console.log(`   ✅ Encontradas coordenadas: ${coords.lat}, ${coords.lng}`)

      // Update the crag
      await prisma.crag.update({
        where: { id: crag.id },
        data: {
          latitude: coords.lat,
          longitude: coords.lng,
          geometry: {
            lat: coords.lat,
            long: coords.lng,
          },
          updatedAt: new Date(),
        },
      })

      updated++
    } else {
      console.log(`   ❌ No se encontraron coordenadas`)
      failed++
    }
  }

  console.log('')
  console.log('='.repeat(60))
  console.log('📊 RESUMEN:')
  console.log(`   Crags actualizados: ${updated}`)
  console.log(`   Crags sin coordenadas: ${failed}`)
  console.log('='.repeat(60))
}

function extractCoordsFromText(
  approach: string | null,
  description: string | null,
  apiResponseRaw: unknown,
): { lat: number; lng: number } | null {
  // Combine all text sources
  let fullText = [approach || '', description || ''].join(' ')

  // Also check beta from apiResponseRaw
  const raw = apiResponseRaw as any
  if (raw?.beta && Array.isArray(raw.beta)) {
    for (const beta of raw.beta) {
      if (beta.markdown) {
        fullText += ' ' + beta.markdown
      }
    }
  }

  if (!fullText.trim()) {
    return null
  }

  // Pattern 1: :parking:, lat, lng
  // Example: ":parking:, 39.826554, -0.574161"
  const parkingMatch = fullText.match(
    /:parking:[,\s]+(-?\d{1,3}\.\d{3,8})\s*,\s*(-?\d{1,3}\.\d{3,8})/i,
  )
  if (parkingMatch) {
    const lat = parseFloat(parkingMatch[1])
    const lng = parseFloat(parkingMatch[2])
    if (isValidCoordinate(lat, lng)) {
      return { lat, lng }
    }
  }

  // Pattern 2: Generic coordinate pattern (lat, lng)
  const genericMatches = fullText.matchAll(
    /[(\s,](-?\d{1,3}\.\d{4,8})\s*,\s*(-?\d{1,3}\.\d{4,8})[)\s,]/g,
  )
  for (const match of genericMatches) {
    const lat = parseFloat(match[1])
    const lng = parseFloat(match[2])
    if (isValidCoordinate(lat, lng) && Math.abs(lat) > 20) {
      return { lat, lng }
    }
  }

  // Pattern 3: Google Maps URL in text
  const mapsMatch = fullText.match(
    /google\.com\/maps[^"'\s]*[?&@](-?\d+\.?\d*),(-?\d+\.?\d*)/i,
  )
  if (mapsMatch) {
    const lat = parseFloat(mapsMatch[1])
    const lng = parseFloat(mapsMatch[2])
    if (isValidCoordinate(lat, lng)) {
      return { lat, lng }
    }
  }

  return null
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  )
}
