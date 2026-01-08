#!/usr/bin/env bun
/**
 * Script to completely obliterate the scrape queue
 * WARNING: This will remove ALL jobs including active ones
 */

import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { JobsPlugin } from '@OneJs/jobs'
import { PrismaPlugin } from '@OneJs/prisma'
import { QueueService } from '@OneJs/jobs'

async function main() {
  console.log('🚀 Starting OneJs...')

  // Register plugins
  PluginRegistry.register(new PrismaPlugin())
  PluginRegistry.register(new JobsPlugin())
  PluginRegistry.register(new BootstrapLoader())

  const oneJs = new OneJs(import.meta.url)
  await oneJs.start()

  const container = ContainerProvider.getContainer()
  const queueService = container.get(QueueService)

  const SCRAPE_QUEUE = 'scrape-country'

  console.log('\n⚠️  WARNING: This will obliterate ALL jobs in the queue!')
  console.log('   Including active, waiting, delayed, completed, and failed jobs.\n')

  console.log('📊 Current queue metrics:')
  const beforeMetrics = await queueService.getQueueMetrics(SCRAPE_QUEUE)
  console.log(JSON.stringify(beforeMetrics, null, 2))

  console.log('\n🧹 Obliterating queue...')
  
  // Clean all job types
  await queueService.cleanQueue(SCRAPE_QUEUE, 0, 'completed')
  await queueService.cleanQueue(SCRAPE_QUEUE, 0, 'failed')
  await queueService.cleanQueue(SCRAPE_QUEUE, 0, 'active')
  await queueService.cleanQueue(SCRAPE_QUEUE, 0, 'delayed')
  await queueService.cleanQueue(SCRAPE_QUEUE, 0, 'wait')
  await queueService.drainQueue(SCRAPE_QUEUE)

  console.log('✅ Queue obliterated!')

  console.log('\n📊 Queue metrics after obliteration:')
  const afterMetrics = await queueService.getQueueMetrics(SCRAPE_QUEUE)
  console.log(JSON.stringify(afterMetrics, null, 2))

  console.log('\n✅ Done! You can now enqueue fresh jobs.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
