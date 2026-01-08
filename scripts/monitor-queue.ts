#!/usr/bin/env bun
/**
 * Script to monitor the scrape-country queue in real-time
 * Shows waiting, active, completed, failed, and delayed jobs
 */

import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { PrismaPlugin } from '@OneJs/prisma'
import { JobsPlugin, QueueService } from '@OneJs/jobs'
import { SCRAPE_QUEUE } from '@scraper-thecrag/infrastructure/jobs/scrape-country.job'

// Import jobs so they get registered
import '@scraper-thecrag/infrastructure/jobs/scrape-country.job'

async function displayMetrics(queue: QueueService) {
  const metrics = await queue.getQueueMetrics(SCRAPE_QUEUE)
  
  console.clear()
  console.log('📊 Scrape Queue Metrics')
  console.log('='.repeat(50))
  console.log(`⏳ Waiting:   ${metrics.waiting}`)
  console.log(`🔄 Active:    ${metrics.active}`)
  console.log(`✅ Completed: ${metrics.completed}`)
  console.log(`❌ Failed:    ${metrics.failed}`)
  console.log(`⏰ Delayed:   ${metrics.delayed}`)
  console.log('='.repeat(50))
  console.log(`Last updated: ${new Date().toLocaleTimeString()}`)
  console.log('\nPress Ctrl+C to exit')
}

async function showActiveJobs(queue: QueueService) {
  const activeJobs = await queue.getJobs(SCRAPE_QUEUE, 'active', 0, 10)
  
  if (activeJobs.length > 0) {
    console.log('\n🔄 Active Jobs:')
    for (const job of activeJobs) {
      const progress = job.progress as any
      const elapsed = progress?.elapsed ? `${Math.floor(progress.elapsed / 60)}m ${progress.elapsed % 60}s` : 'N/A'
      console.log(`  - ${job.data.countryName} (${job.id})`)
      console.log(`    Progress: ${progress?.crags || 0}C ${progress?.areas || 0}A ${progress?.sectors || 0}S ${progress?.routes || 0}R`)
      console.log(`    Elapsed: ${elapsed}`)
      if (progress?.currentCrag) {
        console.log(`    Current: ${progress.currentCrag}`)
      }
    }
  }
}

async function showFailedJobs(queue: QueueService) {
  const failedJobs = await queue.getJobs(SCRAPE_QUEUE, 'failed', 0, 5)
  
  if (failedJobs.length > 0) {
    console.log('\n❌ Recent Failed Jobs:')
    for (const job of failedJobs) {
      console.log(`  - ${job.data.countryName} (${job.id})`)
      console.log(`    Error: ${job.failedReason}`)
      console.log(`    Attempts: ${job.attemptsMade}/${job.opts.attempts}`)
    }
  }
}

async function main() {
  console.log('🚀 Starting OneJs...')
  
  // Register plugins
  PluginRegistry.register(new PrismaPlugin())
  PluginRegistry.register(new JobsPlugin())
  PluginRegistry.register(new BootstrapLoader())

  const oneJs = new OneJs(import.meta.url)
  await oneJs.start()
  
  const container = ContainerProvider.getContainer()
  const queue = container.get(QueueService)

  // Initial display
  await displayMetrics(queue)
  await showActiveJobs(queue)
  await showFailedJobs(queue)

  // Update every 5 seconds
  setInterval(async () => {
    await displayMetrics(queue)
    await showActiveJobs(queue)
    await showFailedJobs(queue)
  }, 5000)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
