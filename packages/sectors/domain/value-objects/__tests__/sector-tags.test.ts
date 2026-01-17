import { describe, expect, test } from 'bun:test'
import {
  AspectDirection,
  CrowdLevel,
  FamilyFriendly,
  SectorTags,
  WalkInTime,
  WeatherCondition,
} from '../sector-tags.vo'

describe('SectorTags Value Object - Human-Readable Labels', () => {
  describe('getAspectLabel', () => {
    test('should return null when aspect is null', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getAspectLabel()

      // Assert
      expect(result).toBeNull()
    })

    test('should return "Norte" for N aspect', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        AspectDirection.N,
        null,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getAspectLabel()

      // Assert
      expect(result).toBe('Norte')
    })

    test('should return "Sureste" for SE aspect', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        AspectDirection.SE,
        null,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getAspectLabel()

      // Assert
      expect(result).toBe('Sureste')
    })

    test('should return "Oeste" for W aspect', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        AspectDirection.W,
        null,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getAspectLabel()

      // Assert
      expect(result).toBe('Oeste')
    })
  })

  describe('getWalkInTimeLabel', () => {
    test('should return null when walkInTime is null', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getWalkInTimeLabel()

      // Assert
      expect(result).toBeNull()
    })

    test('should return "< 5 min" for UNDER_5_MIN', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        WalkInTime.UNDER_5_MIN,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getWalkInTimeLabel()

      // Assert
      expect(result).toBe('< 5 min')
    })

    test('should return "10-20 min" for FROM_10_TO_20_MIN', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        WalkInTime.FROM_10_TO_20_MIN,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getWalkInTimeLabel()

      // Assert
      expect(result).toBe('10-20 min')
    })

    test('should return "> 60 min" for OVER_60_MIN', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        WalkInTime.OVER_60_MIN,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getWalkInTimeLabel()

      // Assert
      expect(result).toBe('> 60 min')
    })
  })

  describe('getFamilyLabel', () => {
    test('should return null when family is null', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getFamilyLabel()

      // Assert
      expect(result).toBeNull()
    })

    test('should return "Apto niños" for KID_FRIENDLY', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        FamilyFriendly.KID_FRIENDLY,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getFamilyLabel()

      // Assert
      expect(result).toBe('Apto niños')
    })

    test('should return "No apto niños" for NOT_KID_FRIENDLY', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        FamilyFriendly.NOT_KID_FRIENDLY,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getFamilyLabel()

      // Assert
      expect(result).toBe('No apto niños')
    })
  })

  describe('getWeatherLabels', () => {
    test('should return empty array when weather is empty', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getWeatherLabels()

      // Assert
      expect(result).toEqual([])
    })

    test('should return "Sol todo el día" for ALL_DAY_SUN', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [WeatherCondition.ALL_DAY_SUN],
        null,
        null,
      )

      // Act
      const result = tags.getWeatherLabels()

      // Assert
      expect(result).toEqual(['Sol todo el día'])
    })

    test('should return multiple weather labels', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [WeatherCondition.MORNING_SUN, WeatherCondition.AFTERNOON_SHADE],
        null,
        null,
      )

      // Act
      const result = tags.getWeatherLabels()

      // Assert
      expect(result).toEqual(['Sol mañana', 'Sombra tarde'])
    })
  })

  describe('getCrowdsLabel', () => {
    test('should return null when crowds is null', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [],
        null,
        null,
      )

      // Act
      const result = tags.getCrowdsLabel()

      // Assert
      expect(result).toBeNull()
    })

    test('should return "Desierto" for DESERTED', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [],
        CrowdLevel.DESERTED,
        null,
      )

      // Act
      const result = tags.getCrowdsLabel()

      // Assert
      expect(result).toBe('Desierto')
    })

    test('should return "Tranquilo" for QUIET', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [],
        CrowdLevel.QUIET,
        null,
      )

      // Act
      const result = tags.getCrowdsLabel()

      // Assert
      expect(result).toBe('Tranquilo')
    })

    test('should return "Concurrido" for BUSY', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [],
        CrowdLevel.BUSY,
        null,
      )

      // Act
      const result = tags.getCrowdsLabel()

      // Assert
      expect(result).toBe('Concurrido')
    })

    test('should return "Muy concurrido" for CROWDED', () => {
      // Arrange
      const tags = SectorTags.createFromAtomic(
        null,
        null,
        null,
        null,
        [],
        CrowdLevel.CROWDED,
        null,
      )

      // Act
      const result = tags.getCrowdsLabel()

      // Assert
      expect(result).toBe('Muy concurrido')
    })
  })
})
