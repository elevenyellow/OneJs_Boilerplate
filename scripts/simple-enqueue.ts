#!/usr/bin/env bun
/**
 * Simple script to enqueue Spain for scraping
 * Run this AFTER restarting your worker
 */

import { PrismaClientOneJs } from '@OneJs/core'

async function main() {
  const prisma = new PrismaClientOneJs()
  
  try {
    // Find Spain in the database
    const spain = await prisma.country.findFirst({
      where: { name: 'Spain' }
    })
    
    if (!spain) {
      console.error('❌ Spain not found in database')
      process.exit(1)
    }
    
    console.log('✅ Found Spain in database:')
    console.log(`   ID: ${spain.id}`)
    console.log(`   External ID: ${spain.externalId}`)
    console.log(`   Name: ${spain.name}`)
    console.log('\n📝 Now add a job via your API or worker startup')
    console.log('   The job will use the correct ID from the database')
    
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
