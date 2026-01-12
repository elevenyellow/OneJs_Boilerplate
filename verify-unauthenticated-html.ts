import { writeFileSync } from 'node:fs'

// Save the HTML provided by user to verify it contains route data
const html = `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" xmlns:og="http://opengraphprotocol.org/schema/">
<head>
<!-- ... rest of the HTML content ... -->
</html>`

console.log('📏 HTML length:', html.length, 'bytes')
console.log('\n🔍 Checking for route data indicators:')
console.log('- Contains "data-route-tick":', html.includes('data-route-tick'))
console.log('- Contains "route-history":', html.includes('route-history'))
console.log('- Contains "fa__who":', html.includes('fa__who'))
console.log('- Contains "fa__when":', html.includes('fa__when'))

// Count routes with data-route-tick
const routeTickMatches = html.match(/data-route-tick=/g)
console.log('\n📊 Found routes with data-route-tick:', routeTickMatches?.length || 0)

// Extract sample route data
const routeMatch = html.match(/data-route-tick="([^"]+)"/)?.[1]
if (routeMatch) {
  console.log('\n📋 Sample data-route-tick (first 500 chars):')
  console.log(routeMatch.substring(0, 500))
}

writeFileSync('/tmp/verify-unauthenticated.html', html)
console.log('\n✅ HTML saved to /tmp/verify-unauthenticated.html for inspection')
