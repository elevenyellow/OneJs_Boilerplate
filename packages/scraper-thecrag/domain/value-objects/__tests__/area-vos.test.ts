import { describe, expect, test } from 'bun:test'
import { AreaBeta } from '../area-beta.vo'
import { AreaDescription } from '../area-description.vo'
import { AreaName } from '../area-name.vo'
import { AreaSlug } from '../area-slug.vo'
import { AreaUrl } from '../area-url.vo'

// ============================================
// AreaName Value Object Tests
// ============================================

describe('AreaName Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create area name with valid name
  // 2. ✓ Get area name value
  // 3. ✓ Reject empty name
  // 4. ✓ Reject whitespace-only name
  // 5. ✓ Trim whitespace from name
  // 6. ✓ Compare two area names for equality
  // 7. ✓ Convert to string

  test('should create area name with valid name', () => {
    // Arrange & Act
    const areaName = AreaName.create('El Potrero Chico')

    // Assert
    expect(areaName).toBeInstanceOf(AreaName)
  })

  test('should get area name value', () => {
    // Arrange
    const areaName = AreaName.create('El Potrero Chico')

    // Act
    const value = areaName.getValue()

    // Assert
    expect(value).toBe('El Potrero Chico')
  })

  test('should reject empty name', () => {
    // Arrange & Act & Assert
    expect(() => AreaName.create('')).toThrow('Area name cannot be empty')
  })

  test('should reject whitespace-only name', () => {
    // Arrange & Act & Assert
    expect(() => AreaName.create('   ')).toThrow('Area name cannot be empty')
  })

  test('should trim whitespace from name', () => {
    // Arrange & Act
    const areaName = AreaName.create('  El Potrero Chico  ')

    // Assert
    expect(areaName.getValue()).toBe('El Potrero Chico')
  })

  test('should compare two area names for equality', () => {
    // Arrange
    const areaName1 = AreaName.create('El Potrero Chico')
    const areaName2 = AreaName.create('El Potrero Chico')
    const areaName3 = AreaName.create('Yosemite')

    // Act & Assert
    expect(areaName1.equals(areaName2)).toBe(true)
    expect(areaName1.equals(areaName3)).toBe(false)
  })

  test('should convert to string', () => {
    // Arrange
    const areaName = AreaName.create('El Potrero Chico')

    // Act & Assert
    expect(areaName.toString()).toBe('El Potrero Chico')
  })

  test('should create from trusted source with createFrom', () => {
    // Arrange & Act
    const areaName = AreaName.createFrom('El Potrero Chico')

    // Assert
    expect(areaName.getValue()).toBe('El Potrero Chico')
  })

  test('should convert to DTO', () => {
    // Arrange
    const areaName = AreaName.create('El Potrero Chico')

    // Act
    const dto = areaName.toDto()

    // Assert
    expect(dto).toBe('El Potrero Chico')
  })
})

// ============================================
// AreaSlug Value Object Tests
// ============================================

describe('AreaSlug Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create area slug with valid slug
  // 2. ✓ Get area slug value
  // 3. ✓ Reject empty slug
  // 4. ✓ Trim whitespace from slug
  // 5. ✓ Compare two area slugs for equality
  // 6. ✓ Convert to string

  test('should create area slug with valid slug', () => {
    // Arrange & Act
    const areaSlug = AreaSlug.create('el-potrero-chico')

    // Assert
    expect(areaSlug).toBeInstanceOf(AreaSlug)
  })

  test('should get area slug value', () => {
    // Arrange
    const areaSlug = AreaSlug.create('el-potrero-chico')

    // Act
    const value = areaSlug.getValue()

    // Assert
    expect(value).toBe('el-potrero-chico')
  })

  test('should reject empty slug', () => {
    // Arrange & Act & Assert
    expect(() => AreaSlug.create('')).toThrow('Area slug cannot be empty')
  })

  test('should trim whitespace from slug', () => {
    // Arrange & Act
    const areaSlug = AreaSlug.create('  el-potrero-chico  ')

    // Assert
    expect(areaSlug.getValue()).toBe('el-potrero-chico')
  })

  test('should compare two area slugs for equality', () => {
    // Arrange
    const slug1 = AreaSlug.create('el-potrero-chico')
    const slug2 = AreaSlug.create('el-potrero-chico')
    const slug3 = AreaSlug.create('yosemite')

    // Act & Assert
    expect(slug1.equals(slug2)).toBe(true)
    expect(slug1.equals(slug3)).toBe(false)
  })

  test('should convert to string', () => {
    // Arrange
    const areaSlug = AreaSlug.create('el-potrero-chico')

    // Act & Assert
    expect(areaSlug.toString()).toBe('el-potrero-chico')
  })

  test('should create from trusted source with createFrom', () => {
    // Arrange & Act
    const areaSlug = AreaSlug.createFrom('el-potrero-chico')

    // Assert
    expect(areaSlug.getValue()).toBe('el-potrero-chico')
  })

  test('should convert to DTO', () => {
    // Arrange
    const areaSlug = AreaSlug.create('el-potrero-chico')

    // Act
    const dto = areaSlug.toDto()

    // Assert
    expect(dto).toBe('el-potrero-chico')
  })
})

// ============================================
// AreaUrl Value Object Tests
// ============================================

describe('AreaUrl Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create area URL with valid URL
  // 2. ✓ Get area URL value
  // 3. ✓ Reject empty URL
  // 4. ✓ Trim whitespace from URL
  // 5. ✓ Compare two area URLs for equality
  // 6. ✓ Convert to string
  // 7. ✓ Check if URL is from TheCrag

  test('should create area URL with valid URL', () => {
    // Arrange & Act
    const areaUrl = AreaUrl.create(
      'https://www.thecrag.com/climbing/mexico/el-potrero-chico',
    )

    // Assert
    expect(areaUrl).toBeInstanceOf(AreaUrl)
  })

  test('should get area URL value', () => {
    // Arrange
    const areaUrl = AreaUrl.create(
      'https://www.thecrag.com/climbing/mexico/el-potrero-chico',
    )

    // Act
    const value = areaUrl.getValue()

    // Assert
    expect(value).toBe(
      'https://www.thecrag.com/climbing/mexico/el-potrero-chico',
    )
  })

  test('should reject empty URL', () => {
    // Arrange & Act & Assert
    expect(() => AreaUrl.create('')).toThrow('Area URL cannot be empty')
  })

  test('should trim whitespace from URL', () => {
    // Arrange & Act
    const areaUrl = AreaUrl.create(
      '  https://www.thecrag.com/climbing/mexico  ',
    )

    // Assert
    expect(areaUrl.getValue()).toBe('https://www.thecrag.com/climbing/mexico')
  })

  test('should compare two area URLs for equality', () => {
    // Arrange
    const url1 = AreaUrl.create('https://www.thecrag.com/climbing/mexico')
    const url2 = AreaUrl.create('https://www.thecrag.com/climbing/mexico')
    const url3 = AreaUrl.create('https://www.thecrag.com/climbing/usa')

    // Act & Assert
    expect(url1.equals(url2)).toBe(true)
    expect(url1.equals(url3)).toBe(false)
  })

  test('should convert to string', () => {
    // Arrange
    const areaUrl = AreaUrl.create('https://www.thecrag.com/climbing/mexico')

    // Act & Assert
    expect(areaUrl.toString()).toBe('https://www.thecrag.com/climbing/mexico')
  })

  test('should check if URL is from TheCrag', () => {
    // Arrange
    const theCragUrl = AreaUrl.create('https://www.thecrag.com/climbing/mexico')
    const otherUrl = AreaUrl.create('https://example.com/climbing')

    // Act & Assert
    expect(theCragUrl.isTheCragUrl()).toBe(true)
    expect(otherUrl.isTheCragUrl()).toBe(false)
  })

  test('should create from trusted source with createFrom', () => {
    // Arrange & Act
    const areaUrl = AreaUrl.createFrom(
      'https://www.thecrag.com/climbing/mexico',
    )

    // Assert
    expect(areaUrl.getValue()).toBe('https://www.thecrag.com/climbing/mexico')
  })

  test('should convert to DTO', () => {
    // Arrange
    const areaUrl = AreaUrl.create('https://www.thecrag.com/climbing/mexico')

    // Act
    const dto = areaUrl.toDto()

    // Assert
    expect(dto).toBe('https://www.thecrag.com/climbing/mexico')
  })
})

// ============================================
// AreaDescription Value Object Tests
// ============================================

describe('AreaDescription Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create area description with valid description
  // 2. ✓ Create area description with null
  // 3. ✓ Get area description value
  // 4. ✓ Check if description is empty
  // 5. ✓ Trim whitespace from description
  // 6. ✓ Compare two area descriptions for equality
  // 7. ✓ Convert to string

  test('should create area description with valid description', () => {
    // Arrange & Act
    const description = AreaDescription.create(
      'A beautiful climbing area in Mexico',
    )

    // Assert
    expect(description).toBeInstanceOf(AreaDescription)
  })

  test('should create area description with null', () => {
    // Arrange & Act
    const description = AreaDescription.create(null)

    // Assert
    expect(description).toBeInstanceOf(AreaDescription)
    expect(description.getValue()).toBeNull()
  })

  test('should get area description value', () => {
    // Arrange
    const description = AreaDescription.create(
      'A beautiful climbing area in Mexico',
    )

    // Act
    const value = description.getValue()

    // Assert
    expect(value).toBe('A beautiful climbing area in Mexico')
  })

  test('should check if description is empty', () => {
    // Arrange
    const withContent = AreaDescription.create('Some content')
    const withNull = AreaDescription.create(null)
    const withEmpty = AreaDescription.create('')

    // Act & Assert
    expect(withContent.isEmpty()).toBe(false)
    expect(withNull.isEmpty()).toBe(true)
    expect(withEmpty.isEmpty()).toBe(true)
  })

  test('should trim whitespace from description', () => {
    // Arrange & Act
    const description = AreaDescription.create('  A beautiful area  ')

    // Assert
    expect(description.getValue()).toBe('A beautiful area')
  })

  test('should compare two area descriptions for equality', () => {
    // Arrange
    const desc1 = AreaDescription.create('Description A')
    const desc2 = AreaDescription.create('Description A')
    const desc3 = AreaDescription.create('Description B')
    const descNull1 = AreaDescription.create(null)
    const descNull2 = AreaDescription.create(null)

    // Act & Assert
    expect(desc1.equals(desc2)).toBe(true)
    expect(desc1.equals(desc3)).toBe(false)
    expect(descNull1.equals(descNull2)).toBe(true)
  })

  test('should convert to string', () => {
    // Arrange
    const description = AreaDescription.create('A beautiful climbing area')

    // Act & Assert
    expect(description.toString()).toBe('A beautiful climbing area')
  })

  test('should return empty string for null when converting to string', () => {
    // Arrange
    const description = AreaDescription.create(null)

    // Act & Assert
    expect(description.toString()).toBe('')
  })

  test('should create from trusted source with createFrom', () => {
    // Arrange & Act
    const description = AreaDescription.createFrom('Trusted description')

    // Assert
    expect(description.getValue()).toBe('Trusted description')
  })

  test('should convert to DTO with value', () => {
    // Arrange
    const description = AreaDescription.create('A beautiful climbing area')

    // Act
    const dto = description.toDto()

    // Assert
    expect(dto).toBe('A beautiful climbing area')
  })

  test('should convert to DTO with null', () => {
    // Arrange
    const description = AreaDescription.create(null)

    // Act
    const dto = description.toDto()

    // Assert
    expect(dto).toBeNull()
  })
})

// ============================================
// AreaBeta Value Object Tests
// ============================================

describe('AreaBeta Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create beta with all fields
  // 2. ✓ Create empty beta
  // 3. ✓ Get summary, description, approach
  // 4. ✓ Check hasSummary, hasDescription, hasApproach
  // 5. ✓ Check hasBeta (any field present)
  // 6. ✓ Get full beta text
  // 7. ✓ Get truncated summary/description
  // 8. ✓ Handle null/empty values
  // 9. ✓ Compare two betas for equality
  // 10. ✓ Convert to string
  // 11. ✓ Convert to DTO

  test('should create beta with all fields', () => {
    // Arrange & Act
    const beta = AreaBeta.create(
      'A great crag for beginners',
      'Detailed description of the area',
      'Park at the lot and walk 5 minutes',
    )

    // Assert
    expect(beta).toBeInstanceOf(AreaBeta)
    expect(beta.getSummary()).toBe('A great crag for beginners')
    expect(beta.getDescription()).toBe('Detailed description of the area')
    expect(beta.getApproach()).toBe('Park at the lot and walk 5 minutes')
  })

  test('should create empty beta', () => {
    // Arrange & Act
    const beta = AreaBeta.empty()

    // Assert
    expect(beta.getSummary()).toBeNull()
    expect(beta.getDescription()).toBeNull()
    expect(beta.getApproach()).toBeNull()
    expect(beta.hasBeta()).toBe(false)
  })

  test('should check hasSummary, hasDescription, hasApproach', () => {
    // Arrange
    const fullBeta = AreaBeta.create('summary', 'description', 'approach')
    const partialBeta = AreaBeta.create('summary', null, null)
    const emptyBeta = AreaBeta.empty()

    // Act & Assert
    expect(fullBeta.hasSummary()).toBe(true)
    expect(fullBeta.hasDescription()).toBe(true)
    expect(fullBeta.hasApproach()).toBe(true)

    expect(partialBeta.hasSummary()).toBe(true)
    expect(partialBeta.hasDescription()).toBe(false)
    expect(partialBeta.hasApproach()).toBe(false)

    expect(emptyBeta.hasSummary()).toBe(false)
    expect(emptyBeta.hasDescription()).toBe(false)
    expect(emptyBeta.hasApproach()).toBe(false)
  })

  test('should check hasBeta when any field present', () => {
    // Arrange
    const onlySummary = AreaBeta.create('summary', null, null)
    const onlyDescription = AreaBeta.create(null, 'description', null)
    const onlyApproach = AreaBeta.create(null, null, 'approach')
    const empty = AreaBeta.empty()

    // Act & Assert
    expect(onlySummary.hasBeta()).toBe(true)
    expect(onlyDescription.hasBeta()).toBe(true)
    expect(onlyApproach.hasBeta()).toBe(true)
    expect(empty.hasBeta()).toBe(false)
  })

  test('should get full beta text', () => {
    // Arrange
    const beta = AreaBeta.create(
      'Summary text',
      'Description text',
      'Approach info',
    )

    // Act
    const fullText = beta.getFullBetaText()

    // Assert
    expect(fullText).toContain('Summary text')
    expect(fullText).toContain('Description text')
    expect(fullText).toContain('Approach: Approach info')
  })

  test('should get truncated summary', () => {
    // Arrange
    const longSummary = 'A'.repeat(200)
    const beta = AreaBeta.create(longSummary, null, null)

    // Act
    const truncated = beta.getSummaryTruncated(50)

    // Assert
    expect(truncated).toBe('A'.repeat(50) + '...')
  })

  test('should not truncate short summary', () => {
    // Arrange
    const shortSummary = 'Short summary'
    const beta = AreaBeta.create(shortSummary, null, null)

    // Act
    const truncated = beta.getSummaryTruncated(50)

    // Assert
    expect(truncated).toBe('Short summary')
  })

  test('should trim whitespace from values', () => {
    // Arrange & Act
    const beta = AreaBeta.create(
      '  summary  ',
      '  description  ',
      '  approach  ',
    )

    // Assert
    expect(beta.getSummary()).toBe('summary')
    expect(beta.getDescription()).toBe('description')
    expect(beta.getApproach()).toBe('approach')
  })

  test('should treat empty strings as null', () => {
    // Arrange & Act
    const beta = AreaBeta.create('', '', '')

    // Assert
    expect(beta.getSummary()).toBeNull()
    expect(beta.getDescription()).toBeNull()
    expect(beta.getApproach()).toBeNull()
    expect(beta.hasBeta()).toBe(false)
  })

  test('should compare two betas for equality', () => {
    // Arrange
    const beta1 = AreaBeta.create('summary', 'description', 'approach')
    const beta2 = AreaBeta.create('summary', 'description', 'approach')
    const beta3 = AreaBeta.create('different', 'description', 'approach')

    // Act & Assert
    expect(beta1.equals(beta2)).toBe(true)
    expect(beta1.equals(beta3)).toBe(false)
  })

  test('should convert to string', () => {
    // Arrange
    const fullBeta = AreaBeta.create('summary', 'description', 'approach')
    const partialBeta = AreaBeta.create('summary', null, null)
    const emptyBeta = AreaBeta.empty()

    // Act & Assert
    expect(fullBeta.toString()).toBe('AreaBeta(summary, desc, approach)')
    expect(partialBeta.toString()).toBe('AreaBeta(summary)')
    expect(emptyBeta.toString()).toBe('AreaBeta(empty)')
  })

  test('should convert to DTO', () => {
    // Arrange
    const beta = AreaBeta.create('summary', 'description', 'approach')

    // Act
    const dto = beta.toDto()

    // Assert
    expect(dto).toEqual({
      summary: 'summary',
      description: 'description',
      approach: 'approach',
    })
  })

  test('should convert empty to DTO with nulls', () => {
    // Arrange
    const beta = AreaBeta.empty()

    // Act
    const dto = beta.toDto()

    // Assert
    expect(dto).toEqual({
      summary: null,
      description: null,
      approach: null,
    })
  })
})
