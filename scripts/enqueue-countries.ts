#!/usr/bin/env bun
/**
 * Script to enqueue country scraping jobs
 */

import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { JobsPlugin } from '@OneJs/jobs'
import { PrismaPlugin } from '@OneJs/prisma'
import { ScraperQueueService } from '@scraper-thecrag/application/services/scraper-queue.service'

// Import jobs so they get registered
import '@scraper-thecrag/infrastructure/jobs/scrape-country.job'

async function main() {
  console.log('🚀 Starting OneJs...')

  // Register plugins
  PluginRegistry.register(new PrismaPlugin())
  PluginRegistry.register(new JobsPlugin())
  PluginRegistry.register(new BootstrapLoader())

  const oneJs = new OneJs(import.meta.url)
  await oneJs.start()

  const container = ContainerProvider.getContainer()
  const scraperQueue = container.get(ScraperQueueService)

  console.log('\n📊 Current queue metrics:')
  const beforeMetrics = await scraperQueue.getMetrics()
  console.log(JSON.stringify(beforeMetrics, null, 2))

  console.log('\n📋 Enqueuing countries...')
  const enqueued = await scraperQueue.enqueueCountries()
  console.log(`✅ Enqueued ${enqueued} country scraping job(s)`)

  console.log('\n📊 Queue metrics after enqueuing:')
  const afterMetrics = await scraperQueue.getMetrics()
  console.log(JSON.stringify(afterMetrics, null, 2))

  console.log('\n✅ Done!')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
