import { TheCragApiScraper } from '@scraper-thecrag'

const COOKIE =
  'ApacheSessionID=bdbf10d0e2064b1b4196ee0d6afa816208a52d15; userstatus=anon; NavCtx=/climbing/world; cf_clearance=FLCCerhetDGKAivb0pyzokcwg_DmnL7htMmD2tsWkRg-1767819670-1.2.1.1-B9WhjYDr61OG2P0BEAHBN4e9UuWYznqHghlonBTkASwg9fvb9B6AFEPMzmW9vYosVKejhKQmAoNs9AuKVg9wsVr75iSaWFB2lMIBxDgAiO1Ix41ohaeRrbVchFQBLml.Im2CMuij9kkkB5dsOFll.y8M1Lkl.Ds8zNPBVFaZL4eZs2fgef.P_AtMOM05dpUkab9O3cLQh9XInYd7MnSI5Pfd7gCqOdOgauu_yqGYFa0; _ga_E4F0QR29VH=GS2.1.s1767816546$o6$g1$t1767820204$j52$l0$h0; _ga=GA1.1.334307432.1767779711; acceptedterms=1'

const WORLD_ID = 7546063
const EUROPE_ID = 11737771

async function main() {
  const scraper = new TheCragApiScraper()
  scraper.setCookie(COOKIE)

  console.log('🔍 Checking ID types from scraper...\n')

  // Get Europe countries
  const countries = await scraper.getChildren(EUROPE_ID)

  console.log(`Found ${countries.length} countries in Europe\n`)

  // Check first 5 countries
  for (const country of countries.slice(0, 10)) {
    console.log(`  ${country.name}:`)
    console.log(`    id: ${country.id} (type: ${typeof country.id})`)
    console.log(`    isInteger: ${Number.isInteger(country.id)}`)
    console.log(`    isPositive: ${country.id > 0}`)
    console.log('')
  }
}

main().catch(console.error)
