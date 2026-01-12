import { spawn } from 'bun'

async function testRealHtml() {
  console.log('📥 Testing HTML fetch with improved headers...\n')

  const url = 'https://www.thecrag.com/en/climbing/spain/jerica/area/164277735'

  // Try with maximum browser-like headers
  const args = [
    'curl',
    url,
    '--globoff',
    '--compressed',
    '-s',
    '-L',
    '-H',
    'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    '-H',
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    '-H',
    'Accept-Language: en-US,en;q=0.5',
    '-H',
    'Accept-Encoding: gzip, deflate, br',
    '-H',
    'DNT: 1',
    '-H',
    'Connection: keep-alive',
    '-H',
    'Upgrade-Insecure-Requests: 1',
    '-H',
    'Sec-Fetch-Dest: document',
    '-H',
    'Sec-Fetch-Mode: navigate',
    '-H',
    'Sec-Fetch-Site: none',
    '-H',
    'Sec-Fetch-User: ?1',
    '-H',
    'Cache-Control: max-age=0',
  ]

  console.log('🔄 Making request with browser-like headers...')
  const proc = spawn({
    cmd: args,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const html = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()

  if (stderr) {
    console.error('❌ STDERR:', stderr)
  }

  console.log(`\n📊 Response size: ${html.length} bytes`)
  console.log(`\n📄 First 1000 chars:\n${html.slice(0, 1000)}`)
  console.log(`\n🔍 Checking for key indicators:`)
  console.log(
    `- Contains "data-route-tick": ${html.includes('data-route-tick')}`,
  )
  console.log(`- Contains "route-history": ${html.includes('route-history')}`)
  console.log(`- Contains "fa__who": ${html.includes('fa__who')}`)
  console.log(`- Contains "fa__when": ${html.includes('fa__when')}`)
  console.log(
    `- Contains "Cloudflare": ${html.includes('cloudflare') || html.includes('Cloudflare')}`,
  )
  console.log(
    `- Contains "Attention Required": ${html.includes('Attention Required')}`,
  )

  // Save to file
  await Bun.write('/tmp/test-real-html.html', html)
  console.log(`\n✅ Full HTML saved to /tmp/test-real-html.html`)
}

testRealHtml()
