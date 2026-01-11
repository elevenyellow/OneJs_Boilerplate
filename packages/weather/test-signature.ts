/**
 * Test script to verify Meteoblue signature generation
 * Based on test-blue.ts which works 100%
 * IMPORTANT: Parameter order affects signature!
 *
 * Usage:
 *   bun run packages/weather/test-signature.ts
 */

import * as crypto from 'node:crypto'

// Test configuration (from working test-blue.ts)
const API_KEY = 'ju8r3cfheu938' // Working API key
const SHARED_SECRET = 'j}8Lb}?H'
const BASE_URL = 'https://my.meteoblue.com'

// Test coordinates (El Altet, Spain - from working code)
const LAT = '38.273' // As string, 3 decimals
const LON = '-0.5397' // As string, 4 decimals

/**
 * Generate Meteoblue API signature
 */
function generateSignature(urlPathWithSecret: string): string {
  return crypto
    .createHash('md5')
    .update(urlPathWithSecret, 'utf8')
    .digest('hex')
}

/**
 * Build complete Meteoblue API URL with signature
 * Matches EXACTLY the format from test-blue.ts that works 100%
 */
function buildMeteoblueUrl(): string {
  const packages =
    'trendpro-day_trendpro-1h_trendpro-3h_pictosplit14day_sunmoontrend_mbweb_current_wind-day_wind-1h_wind-3h_clouds-day_webcolors_sunmoon_basic-day_basic-1h_basic-3h_airquality-3h_airquality-1h_pictosplitv2_airquality-day'

  // Expiration timestamp (10 minutes from now, as in working code)
  const expire = Math.floor(Date.now() / 1000) + 600

  // CRITICAL: Parameters in EXACT order from test-blue.ts
  // Order affects signature!
  const params: [string, string][] = [
    ['city', 'El Altet'],
    ['lat', LAT],
    ['lon', LON],
    ['asl', '17.0'], // Note: 17.0 with decimal
    ['tz', 'Europe/Madrid'],
    ['temperature', 'C'],
    ['windspeed', 'ms-1'],
    ['precipitationamount', 'mm'],
    ['winddirection', '2char'],
    ['timeformat', 'iso8601'],
    ['history_days', '1'],
    ['forecast_days', '8'],
    ['expire', expire.toString()],
    ['apikey', API_KEY],
  ]

  // Build query string maintaining exact order
  const queryString = params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

  // Build URL path for signing (INCLUDING secret)
  const urlPathForSigning = `/packages/${packages}?${queryString}&secret=${SHARED_SECRET}`

  // Generate signature
  const signature = generateSignature(urlPathForSigning)

  // Return complete URL (WITHOUT secret, only sig)
  return `${BASE_URL}/packages/${packages}?${queryString}&sig=${signature}`
}

// Run test only when executed directly
if (!import.meta.main) {
  // Do nothing when imported
} else {
  console.log('🧪 Testing Meteoblue Signature Generation')
  console.log('   (Based on test-blue.ts - 100% working format)\n')
  console.log('Configuration:')
  console.log(`  API Key: ${API_KEY}`)
  console.log(`  Shared Secret: ${SHARED_SECRET}`)
  console.log(`  Location: ${LAT}, ${LON} (El Altet, Spain)`)
  console.log(`  Format: EXACT order from working code\n`)

  const url = buildMeteoblueUrl()
  console.log('Generated URL:')
  console.log(`  ${url.substring(0, 150)}...`)
  console.log(`  ...${url.substring(url.length - 50)}\n`)

  // Extract parts for verification
  const urlObj = new URL(url)
  const city = urlObj.searchParams.get('city')
  const lat = urlObj.searchParams.get('lat')
  const lon = urlObj.searchParams.get('lon')
  const asl = urlObj.searchParams.get('asl')
  const expire = urlObj.searchParams.get('expire')
  const sig = urlObj.searchParams.get('sig')
  const timeformat = urlObj.searchParams.get('timeformat')
  const windspeed = urlObj.searchParams.get('windspeed')
  const tz = urlObj.searchParams.get('tz')

  console.log('URL Components:')
  console.log(`  City: ${city}`)
  console.log(`  Lat: ${lat} (should be 38.273)`)
  console.log(`  Lon: ${lon} (should be -0.5397)`)
  console.log(`  ASL: ${asl} (should be 17.0)`)
  console.log(
    `  Expiration: ${expire} (${new Date(Number(expire) * 1000).toISOString()})`,
  )
  console.log(`  Timeformat: ${timeformat} (should be iso8601)`)
  console.log(`  Windspeed: ${windspeed} (should be ms-1)`)
  console.log(`  Timezone: ${tz} (should be Europe/Madrid)`)
  console.log(`  Signature: ${sig}\n`)

  // Test the signature generation step by step
  const packages =
    'trendpro-day_trendpro-1h_trendpro-3h_pictosplit14day_sunmoontrend_mbweb_current_wind-day_wind-1h_wind-3h_clouds-day_webcolors_sunmoon_basic-day_basic-1h_basic-3h_airquality-3h_airquality-1h_pictosplitv2_airquality-day'
  const testPath = urlObj.pathname + urlObj.search.replace(/&sig=.*$/, '')
  const testInput = testPath + '&secret=' + SHARED_SECRET
  const testSig = crypto
    .createHash('md5')
    .update(testInput, 'utf8')
    .digest('hex')

  console.log('Signature Verification:')
  console.log(`  URL Path (without sig): ${testPath.substring(0, 120)}...`)
  console.log(`  Input to Hash: ${testInput.substring(0, 120)}...`)
  console.log(`  Generated Signature: ${testSig}`)
  console.log(`  Matches URL Signature: ${testSig === sig ? '✅' : '❌'}\n`)

  // Verify critical parameters
  const checks = [
    { name: 'City', expected: 'El Altet', actual: city },
    { name: 'Lat', expected: '38.273', actual: lat },
    { name: 'Lon', expected: '-0.5397', actual: lon },
    { name: 'ASL', expected: '17.0', actual: asl },
    { name: 'Timeformat', expected: 'iso8601', actual: timeformat },
    { name: 'Windspeed', expected: 'ms-1', actual: windspeed },
    { name: 'Timezone', expected: 'Europe/Madrid', actual: tz },
  ]

  console.log('Parameter Verification:')
  checks.forEach((check) => {
    const match = check.expected === check.actual
    console.log(
      `  ${check.name}: ${check.actual} ${match ? '✅' : `❌ (expected: ${check.expected})`}`,
    )
  })

  console.log('\n✨ You can test this URL manually:')
  console.log(`   curl "${url}"`)

  console.log('\n' + '='.repeat(70))
  console.log('PARAMETER ORDER (CRITICAL FOR SIGNATURE):')
  console.log('='.repeat(70))
  console.log('1. city')
  console.log('2. lat')
  console.log('3. lon')
  console.log('4. asl')
  console.log('5. tz')
  console.log('6. temperature')
  console.log('7. windspeed')
  console.log('8. precipitationamount')
  console.log('9. winddirection')
  console.log('10. timeformat')
  console.log('11. history_days')
  console.log('12. forecast_days')
  console.log('13. expire')
  console.log('14. apikey')
  console.log('='.repeat(70))
}
