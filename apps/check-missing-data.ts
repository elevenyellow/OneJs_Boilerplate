#!/usr/bin/env bun
/**
 * Script para verificar qué datos de la API no estamos guardando
 */

import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { PrismaPlugin } from '@OneJs/prisma'
import { TheCragApiScraper } from '@scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper'
import { execSync } from 'child_process'

const COOKIE = '__Host-auth=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzA4NTg3MjAsImlhdCI6MTczODIzNTEyMCwicCI6IjI5NzQ5NTcxMCIsInMiOiIyODk3MjQ5OSJ9.oMqEyUZ-N63cpb2PN_7qs0zHWE4J_SIkOTwlFfOdjdFRkq92O_hHMFr6ELqKIlQu6WFoLvCNCpQ3c8TKMrY3nQaJrYNyD89JW1Ywh7xSEAqVpVwMn6Zv1pTuVHv3vWjAg_H9V0nxW-bWxz7qI8gO9VjqoG9lBPtZwXCNpqA3pJrZP3Z2Dh-x1D2R5hSDlQZcVZnHECd5OPbTZI8aZkRcJZ0E-7Pq5lq3nR5G5V8_8hpGVjU4Vhf-rkjv3EwGXXz8DOwCydjNGzLZaZwJjKI5Zph1Z8Q8HHsOj3PQ2s8E73BbU2JwJ4v4Pk2z6mZRZWO2Q1R1R2WOp5Q3E1Q5'

async function main() {
  console.log('🔍 Verificando qué datos de la API no estamos guardando...\n')

  PluginRegistry.register(new PrismaPlugin())
  PluginRegistry.register(new BootstrapLoader())
  const oneJs = new OneJs(import.meta.url)
  await oneJs.start()
  
  const container = ContainerProvider.getContainer()
  const scraper = container.get(TheCragApiScraper)
  scraper.setCookie(COOKIE)

  // Probar con algunos sectores de Valencia
  const testNodeIds = [
    6058653147, // Alcora
    1982825733, // Altura - Kan Pikola
    2123128023, // Araya
  ]

  for (const nodeId of testNodeIds) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`📍 Node ID: ${nodeId}`)
    console.log('='.repeat(80))
    
    const info = await scraper.getNodeInfo(nodeId)
    
    if (!info) {
      console.log('❌ No se pudo obtener info\n')
      continue
    }

    console.log('\n🗂️  DATOS QUE SÍ GUARDAMOS:')
    console.log('─'.repeat(80))
    
    const savedFields = {
      'geometry': info.geometry ? '✅' : '❌',
      'seasonality': info.seasonality ? '✅' : '❌',
      'orientation': info.orientation || '❌',
      'rockType': info.rockType || '❌',
      'climbingStyle': info.climbingStyle ? JSON.stringify(info.climbingStyle) : '❌',
      'sunExposure': info.sunExposure || '❌',
      'sheltered': info.sheltered !== undefined ? String(info.sheltered) : '❌',
      'altNames': info.altNames ? JSON.stringify(info.altNames) : '❌',
      'locatedness': info.locatedness || '❌',
      'numberPhotos': info.numberPhotos || '❌',
      'numberTopos': info.numberTopos || '❌',
      'totalFavorites': info.totalFavorites || '❌',
      'ascentCount': info.ascentCount || '❌',
      'maxPop': info.maxPop || '❌',
      'kudos': info.kudos || '❌',
      'priceCategory': info.priceCategory || '❌',
      'hasTopo': info.hasTopo !== undefined ? String(info.hasTopo) : '❌',
      'beta': info.beta ? `✅ (${info.beta.length} items)` : '❌',
      'siblingLabel': info.siblingLabel || '❌',
      'urlStub': info.urlStub || '❌',
      'urlAncestorStub': info.urlAncestorStub || '❌',
      'tags (raw)': info.tags ? '✅' : '❌',
    }
    
    Object.entries(savedFields).forEach(([key, value]) => {
      const icon = value === '❌' ? '❌' : '✅'
      console.log(`   ${icon} ${key.padEnd(20)}: ${value}`)
    })

    console.log('\n📦 DATOS RAW COMPLETOS DE LA API:')
    console.log('─'.repeat(80))
    
    // Hacer petición raw para ver TODO lo que devuelve la API
    const url = `https://www.thecrag.com/api/node/id/${nodeId}?show=info,description,approach,access,beta,history,ethics`
    const rawResponse = execSync(`curl -s '${url}' -H 'Cookie: ${COOKIE}' -H 'User-Agent: Mozilla/5.0'`).toString()
    const rawData = JSON.parse(rawResponse)
    
    console.log('\n🔑 TODAS LAS CLAVES EN LA RESPUESTA:')
    const allKeys = Object.keys(rawData)
    console.log('   ' + allKeys.join(', '))
    
    console.log('\n🏷️  TAGS (raw):')
    if (rawData.tags && Object.keys(rawData.tags).length > 0) {
      console.log(JSON.stringify(rawData.tags, null, 2))
    } else {
      console.log('   (vacío o no disponible)')
    }
    
    console.log('\n📊 CAMPOS QUE POSIBLEMENTE NO ESTAMOS GUARDANDO:')
    console.log('─'.repeat(80))
    
    const potentiallyMissing = []
    
    // Listar TODOS los campos que vienen en la respuesta
    allKeys.forEach(key => {
      if (!['args', 'method', 'remote_ip', 'error', 'errorLabel'].includes(key)) {
        const value = rawData[key]
        if (value !== null && value !== undefined) {
          let display = ''
          if (typeof value === 'object' && !Array.isArray(value)) {
            display = `{${Object.keys(value).length} keys}`
          } else if (Array.isArray(value)) {
            display = `[${value.length} items]`
          } else {
            display = String(value).substring(0, 50)
          }
          potentiallyMissing.push(`${key}: ${display}`)
        }
      }
    })
    
    potentiallyMissing.forEach(field => {
      console.log(`   • ${field}`)
    })
    
    console.log('\n💾 TAMAÑO DE LA RESPUESTA RAW:')
    console.log(`   ${(rawResponse.length / 1024).toFixed(2)} KB\n`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('📋 RECOMENDACIONES')
  console.log('='.repeat(80))
  console.log('1. ✅ Agregar campo "apiResponseRaw" (JSONB) en Sector, Crag, Area')
  console.log('2. ✅ Guardar la respuesta completa de la API para análisis futuro')
  console.log('3. ✅ Esto evitará tener que re-escrapear para descubrir campos faltantes')
  console.log('4. ⚠️  Revisar si hay campos importantes que no estamos procesando\n')
  
  process.exit(0)
}

main().catch(console.error)
