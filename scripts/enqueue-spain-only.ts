#!/usr/bin/env bun
/**
 * Script to enqueue ONLY Spain scraping job
 */

import { CountryPrismaRepository } from '@climb-zone/country'
import { ContainerProvider, OneJs, PluginRegistry } from '@OneJs/core'
import { BootstrapLoader } from '@OneJs/core/bootstrap/bootstrap-loader'
import { JobsPlugin, QueueService } from '@OneJs/jobs'
import { PrismaPlugin } from '@OneJs/prisma'

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
  const countryRepo = container.get(CountryPrismaRepository)
  const queueService = container.get(QueueService)

  console.log('\n📋 Finding Spain in database...')
  const countries = await countryRepo.findAll()
  const spain = countries.find((c) => c.name === 'Spain')

  if (!spain) {
    console.error('❌ Spain not found in database!')
    process.exit(1)
  }

  console.log(`✅ Found Spain:`)
  console.log(`   ID: ${spain.id.toString()}`)
  console.log(`   External ID: ${spain.externalId.toNumber()}`)

  const SCRAPE_QUEUE = 'scrape-country'

  console.log('\n📋 Enqueuing Spain scraping job...')
  const job = await queueService.addUniqueByData(
    SCRAPE_QUEUE,
    'scrape-country',
    {
      countryId: spain.id.toString(),
      countryExternalId: spain.externalId.toNumber(),
      countryName: spain.name,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000,
      },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  )

  if (job) {
    console.log(`✅ Job enqueued successfully (ID: ${job.id})`)
  } else {
    console.log('⏭️  Job already exists in queue')
  }

  console.log('\n✅ Done!')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
