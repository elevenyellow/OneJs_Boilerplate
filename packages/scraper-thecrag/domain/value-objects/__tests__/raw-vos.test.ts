import { describe, expect, test } from 'bun:test'
import { RawNodeResponse } from '../raw-node-response.vo'
import { RawHtmlResponse } from '../raw-html-response.vo'

describe('RawNodeResponse Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create RawNodeResponse from API JSON
  // 2. ✓ Get raw JSON object
  // 3. ✓ Get raw JSON string
  // 4. ✓ Get node ID from response
  // 5. ✓ Get node name from response
  // 6. ✓ Get response timestamp
  // 7. ✓ Check if response has specific field

  const sampleNodeResponse = {
    id: 17857049,
    name: 'Cheste',
    nid: 17857049,
    slug: 'cheste',
    url: '/climbing/spain/cheste',
    description: 'A popular sport climbing area near Valencia.',
    routes: 42,
    ascents: 979,
    photos: 6,
  }

  test('should create RawNodeResponse from API JSON', () => {
    // Act
    const raw = RawNodeResponse.fromApiResponse(sampleNodeResponse)

    // Assert
    expect(raw).toBeInstanceOf(RawNodeResponse)
  })

  test('should get raw JSON object', () => {
    // Arrange
    const raw = RawNodeResponse.fromApiResponse(sampleNodeResponse)

    // Act
    const json = raw.getRawJson()

    // Assert
    expect(json).toEqual(sampleNodeResponse)
  })

  test('should get raw JSON string', () => {
    // Arrange
    const raw = RawNodeResponse.fromApiResponse(sampleNodeResponse)

    // Act
    const jsonString = raw.getRawJsonString()

    // Assert
    expect(typeof jsonString).toBe('string')
    expect(jsonString).toContain('Cheste')
    expect(jsonString).toContain('17857049')
  })

  test('should get node ID from response', () => {
    // Arrange
    const raw = RawNodeResponse.fromApiResponse(sampleNodeResponse)

    // Act
    const nodeId = raw.getNodeId()

    // Assert
    expect(nodeId).toBe(17857049)
  })

  test('should get node name from response', () => {
    // Arrange
    const raw = RawNodeResponse.fromApiResponse(sampleNodeResponse)

    // Act
    const name = raw.getNodeName()

    // Assert
    expect(name).toBe('Cheste')
  })

  test('should get response timestamp', () => {
    // Arrange
    const beforeCreation = Date.now()
    const raw = RawNodeResponse.fromApiResponse(sampleNodeResponse)
    const afterCreation = Date.now()

    // Act
    const timestamp = raw.getTimestamp()

    // Assert
    expect(timestamp).toBeGreaterThanOrEqual(beforeCreation)
    expect(timestamp).toBeLessThanOrEqual(afterCreation)
  })

  test('should check if response has specific field', () => {
    // Arrange
    const raw = RawNodeResponse.fromApiResponse(sampleNodeResponse)

    // Act & Assert
    expect(raw.hasField('name')).toBe(true)
    expect(raw.hasField('routes')).toBe(true)
    expect(raw.hasField('nonExistentField')).toBe(false)
  })

  test('should get field value', () => {
    // Arrange
    const raw = RawNodeResponse.fromApiResponse(sampleNodeResponse)

    // Act
    const routes = raw.getField('routes')
    const description = raw.getField('description')

    // Assert
    expect(routes).toBe(42)
    expect(description).toBe('A popular sport climbing area near Valencia.')
  })

  test('should get field value with default', () => {
    // Arrange
    const raw = RawNodeResponse.fromApiResponse(sampleNodeResponse)

    // Act
    const existing = raw.getFieldWithDefault('name', 'Unknown')
    const missing = raw.getFieldWithDefault('nonExistent', 'Default Value')

    // Assert
    expect(existing).toBe('Cheste')
    expect(missing).toBe('Default Value')
  })
})

describe('RawHtmlResponse Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create RawHtmlResponse from HTML string
  // 2. ✓ Get raw HTML string
  // 3. ✓ Get URL
  // 4. ✓ Get response timestamp
  // 5. ✓ Get content length
  // 6. ✓ Check if HTML contains specific text

  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="og:image" content="https://example.com/image.jpg">
      <title>Cheste - TheCrag</title>
    </head>
    <body>
      <div class="phototopo" data-topodata="[{&quot;id&quot;:123}]">
        <img src="https://example.com/topo.jpg">
      </div>
      <div class="node-info">
        <p>Description of the area.</p>
      </div>
    </body>
    </html>
  `

  test('should create RawHtmlResponse from HTML string', () => {
    // Act
    const raw = RawHtmlResponse.create(
      sampleHtml,
      'https://www.thecrag.com/climbing/spain/cheste',
    )

    // Assert
    expect(raw).toBeInstanceOf(RawHtmlResponse)
  })

  test('should get raw HTML string', () => {
    // Arrange
    const raw = RawHtmlResponse.create(
      sampleHtml,
      'https://www.thecrag.com/climbing/spain/cheste',
    )

    // Act
    const html = raw.getRawHtml()

    // Assert
    expect(html).toBe(sampleHtml)
  })

  test('should get URL', () => {
    // Arrange
    const raw = RawHtmlResponse.create(
      sampleHtml,
      'https://www.thecrag.com/climbing/spain/cheste',
    )

    // Act
    const url = raw.getUrl()

    // Assert
    expect(url).toBe('https://www.thecrag.com/climbing/spain/cheste')
  })

  test('should get response timestamp', () => {
    // Arrange
    const beforeCreation = Date.now()
    const raw = RawHtmlResponse.create(
      sampleHtml,
      'https://www.thecrag.com/climbing/spain/cheste',
    )
    const afterCreation = Date.now()

    // Act
    const timestamp = raw.getTimestamp()

    // Assert
    expect(timestamp).toBeGreaterThanOrEqual(beforeCreation)
    expect(timestamp).toBeLessThanOrEqual(afterCreation)
  })

  test('should get content length', () => {
    // Arrange
    const raw = RawHtmlResponse.create(
      sampleHtml,
      'https://www.thecrag.com/climbing/spain/cheste',
    )

    // Act
    const length = raw.getContentLength()

    // Assert
    expect(length).toBe(sampleHtml.length)
  })

  test('should check if HTML contains specific text', () => {
    // Arrange
    const raw = RawHtmlResponse.create(
      sampleHtml,
      'https://www.thecrag.com/climbing/spain/cheste',
    )

    // Act & Assert
    expect(raw.contains('phototopo')).toBe(true)
    expect(raw.contains('og:image')).toBe(true)
    expect(raw.contains('nonExistentText123')).toBe(false)
  })

  test('should check if has topo data', () => {
    // Arrange
    const rawWithTopo = RawHtmlResponse.create(
      sampleHtml,
      'https://www.thecrag.com/climbing/spain/cheste',
    )
    const rawWithoutTopo = RawHtmlResponse.create(
      '<html><body>No topo here</body></html>',
      'https://www.thecrag.com/climbing/spain/other',
    )

    // Act & Assert
    expect(rawWithTopo.hasTopoData()).toBe(true)
    expect(rawWithoutTopo.hasTopoData()).toBe(false)
  })

  test('should check if has og:image', () => {
    // Arrange
    const rawWithOgImage = RawHtmlResponse.create(
      sampleHtml,
      'https://www.thecrag.com/climbing/spain/cheste',
    )
    const rawWithoutOgImage = RawHtmlResponse.create(
      '<html><head></head><body>No meta tags here</body></html>',
      'https://www.thecrag.com/climbing/spain/other',
    )

    // Act & Assert
    expect(rawWithOgImage.hasOgImage()).toBe(true)
    expect(rawWithoutOgImage.hasOgImage()).toBe(false)
  })
})
