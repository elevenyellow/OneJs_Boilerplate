#!/usr/bin/env bun
import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { PrismaPlugin } from '@OneJs/prisma'
import { TheCragApiScraper } from '@scraper-thecrag/infrastructure/scrapers/thecrag-api.scraper'

const COOKIE = '__Host-auth=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzA4NTg3MjAsImlhdCI6MTczODIzNTEyMCwicCI6IjI5NzQ5NTcxMCIsInMiOiIyODk3MjQ5OSJ9.oMqEyUZ-N63cpb2PN_7qs0zHWE4J_SIkOTwlFfOdjdFRkq92O_hHMFr6ELqKIlQu6WFoLvCNCpQ3c8TKMrY3nQaJrYNyD89JW1Ywh7xSEAqVpVwMn6Zv1pTuVHv3vWjAg_H9V0nxW-bWxz7qI8gO9VjqoG9lBPtZwXCNpqA3pJrZP3Z2Dh-x1D2R5hSDlQZcVZnHECd5OPbTZI8aZkRcJZ0E-7Pq5lq3nR5G5V8_8hpGVjU4Vhf-rkjv3EwGXXz8DOwCydjNGzLZaZwJjKI5Zph1Z8Q8HHsOj3PQ2s8E73BbU2JwJ4v4Pk2z6mZRZWO2Q1R1R2WOp5Q3E1Q5'

async function main() {
  console.log('🔍 Test: Consultando un solo nodo con tags...\n')

  PluginRegistry.register(new PrismaPlugin())
  PluginRegistry.register(new BootstrapLoader())
  const oneJs = new OneJs(import.meta.url)
  await oneJs.start()
  
  const container = ContainerProvider.getContainer()
  const scraper = container.get(TheCragApiScraper)
  scraper.setCookie(COOKIE)

  // Sector Kan Pikola
  const nodeId = 787112799
  console.log(`📍 Consultando node ${nodeId} (Kan Pikola)...\n`)
  
  const info = await scraper.getNodeInfo(nodeId)
  
  console.log('📦 apiResponseRaw recibido:')
  console.log(JSON.stringify(info?.apiResponseRaw, null, 2).substring(0, 1000) + '...')
  
  console.log('\n🔑 Claves en apiResponseRaw:')
  const keys = Object.keys(info?.apiResponseRaw || {})
  console.log(keys.sort().join(', '))
  
  console.log('\n🏷️  Campo tags:')
  if (info?.apiResponseRaw && 'tags' in info.apiResponseRaw) {
    console.log('✅ SÍ hay campo tags!')
    console.log(JSON.stringify((info.apiResponseRaw as any).tags, null, 2))
  } else {
    console.log('❌ NO hay campo tags')
  }
  
  console.log('\n📊 Campos parseados:')
  console.log(`orientation: ${info?.orientation || 'N/A'}`)
  console.log(`rockType: ${info?.rockType || 'N/A'}`)
  console.log(`climbingStyle: ${info?.climbingStyle || 'N/A'}`)
  console.log(`sunExposure: ${info?.sunExposure || 'N/A'}`)
  
  process.exit(0)
}

main().catch(console.error)
