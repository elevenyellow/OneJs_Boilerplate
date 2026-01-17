import { describe, expect, test } from 'bun:test'
import { AudienceProfile } from '../audience-profile.vo'

describe('AudienceProfile Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create from profile data (simplest)
  // 2. ✓ Detect beginner-friendly sector
  // 3. ✓ Detect intermediate sector
  // 4. ✓ Detect advanced sector
  // 5. ✓ Detect elite sector
  // 6. ✓ Detect family-friendly sector
  // 7. ✓ Get primary audience
  // 8. ✓ Get all suitable audiences
  // 9. ✓ Create empty profile
  // 10. ✓ Serialize to primitives

  describe('Creation', () => {
    test('should create from profile data', () => {
      // Arrange
      const data = {
        beginnerPercentage: 40,
        intermediatePercentage: 35,
        advancedPercentage: 20,
        elitePercentage: 5,
        isFamilyFriendly: true,
        hasBeginner: true,
        hasIntermediate: true,
        hasAdvanced: true,
        hasElite: true,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile).toBeInstanceOf(AudienceProfile)
    })

    test('should create empty profile', () => {
      // Act
      const profile = AudienceProfile.createEmpty()

      // Assert
      expect(profile.isEmpty()).toBe(true)
    })
  })

  describe('Beginner Detection', () => {
    test('should detect beginner-friendly sector', () => {
      // Arrange - More than 30% beginner routes
      const data = {
        beginnerPercentage: 45,
        intermediatePercentage: 40,
        advancedPercentage: 15,
        elitePercentage: 0,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile.isBeginnerFriendly()).toBe(true)
    })

    test('should not detect beginner-friendly for hard sector', () => {
      // Arrange
      const data = {
        beginnerPercentage: 5,
        intermediatePercentage: 30,
        advancedPercentage: 50,
        elitePercentage: 15,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile.isBeginnerFriendly()).toBe(false)
    })
  })

  describe('Intermediate Detection', () => {
    test('should detect intermediate sector', () => {
      // Arrange
      const data = {
        beginnerPercentage: 20,
        intermediatePercentage: 55,
        advancedPercentage: 20,
        elitePercentage: 5,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile.isIntermediateFocused()).toBe(true)
    })
  })

  describe('Advanced Detection', () => {
    test('should detect advanced sector', () => {
      // Arrange
      const data = {
        beginnerPercentage: 5,
        intermediatePercentage: 25,
        advancedPercentage: 55,
        elitePercentage: 15,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile.isAdvancedFocused()).toBe(true)
    })
  })

  describe('Elite Detection', () => {
    test('should detect elite sector', () => {
      // Arrange - More than 10% elite routes
      const data = {
        beginnerPercentage: 0,
        intermediatePercentage: 20,
        advancedPercentage: 50,
        elitePercentage: 30,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile.hasEliteRoutes()).toBe(true)
    })
  })

  describe('Family-Friendly Detection', () => {
    test('should detect family-friendly sector', () => {
      // Arrange
      const data = {
        beginnerPercentage: 50,
        intermediatePercentage: 40,
        advancedPercentage: 10,
        elitePercentage: 0,
        isFamilyFriendly: true,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile.isFamilyFriendly()).toBe(true)
    })
  })

  describe('Primary Audience', () => {
    test('should get primary audience as beginners', () => {
      // Arrange
      const data = {
        beginnerPercentage: 60,
        intermediatePercentage: 30,
        advancedPercentage: 10,
        elitePercentage: 0,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile.getPrimaryAudience()).toBe('beginner')
    })

    test('should get primary audience as intermediate', () => {
      // Arrange
      const data = {
        beginnerPercentage: 20,
        intermediatePercentage: 50,
        advancedPercentage: 25,
        elitePercentage: 5,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile.getPrimaryAudience()).toBe('intermediate')
    })

    test('should get primary audience as advanced', () => {
      // Arrange
      const data = {
        beginnerPercentage: 5,
        intermediatePercentage: 20,
        advancedPercentage: 55,
        elitePercentage: 20,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)

      // Assert
      expect(profile.getPrimaryAudience()).toBe('advanced')
    })
  })

  describe('Suitable Audiences', () => {
    test('should get all suitable audiences', () => {
      // Arrange - Sector suitable for all levels
      const data = {
        beginnerPercentage: 25,
        intermediatePercentage: 40,
        advancedPercentage: 30,
        elitePercentage: 5,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)
      const audiences = profile.getSuitableAudiences()

      // Assert
      expect(audiences).toContain('beginner')
      expect(audiences).toContain('intermediate')
      expect(audiences).toContain('advanced')
    })
  })

  describe('Serialization', () => {
    test('should convert to primitives', () => {
      // Arrange
      const data = {
        beginnerPercentage: 30,
        intermediatePercentage: 40,
        advancedPercentage: 25,
        elitePercentage: 5,
        isFamilyFriendly: true,
      }

      // Act
      const profile = AudienceProfile.createFrom(data)
      const primitives = profile.toPrimitives()

      // Assert
      expect(primitives).toHaveProperty('beginnerPercentage')
      expect(primitives).toHaveProperty('intermediatePercentage')
      expect(primitives).toHaveProperty('advancedPercentage')
      expect(primitives).toHaveProperty('elitePercentage')
      expect(primitives).toHaveProperty('primaryAudience')
      expect(primitives).toHaveProperty('suitableAudiences')
      expect(primitives).toHaveProperty('isFamilyFriendly')
      expect(primitives).toHaveProperty('isBeginnerFriendly')
    })
  })
})
