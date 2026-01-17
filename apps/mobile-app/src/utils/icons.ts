import {
  PersonOutlineIcon,
  PersonIcon,
  PeopleOutlineIcon,
  PeopleIcon,
  SunnyIcon,
  CloudIcon,
  PartlySunnyIcon,
  CloudyIcon,
  ShieldCheckmarkIcon,
  ShieldOutlineIcon,
  AlertIcon,
  WarningIcon,
  HappyOutlineIcon,
  WarningOutlineIcon,
} from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import type { ProtectionRating } from '@/theme/colors'

type IconComponent = React.ComponentType<{ size?: number; color?: string }>

/**
 * Get crowd icon component and color based on crowd level tag
 */
export function getCrowdsIconAndColor(tagCrowds: string | null | undefined): {
  Icon: IconComponent
  color: string
} {
  switch (tagCrowds) {
    case 'DESERTED':
      return { Icon: PersonOutlineIcon, color: colors.crowds.deserted }
    case 'QUIET':
      return { Icon: PersonIcon, color: colors.crowds.quiet }
    case 'BUSY':
      return { Icon: PeopleOutlineIcon, color: colors.crowds.busy }
    case 'CROWDED':
      return { Icon: PeopleIcon, color: colors.crowds.crowded }
    default:
      return { Icon: PeopleOutlineIcon, color: colors.crowds.unknown }
  }
}

/**
 * Get temperature color based on temperature value
 * Good: 10-25°C (green)
 * Moderate: 5-10°C or 25-30°C (amber)
 * Poor: <5°C or >30°C (red)
 */
export function getTemperatureColor(temperature: number | undefined): string {
  if (temperature === undefined) return colors.temperature.unknown
  if (temperature >= 10 && temperature <= 25) return colors.temperature.good
  if (temperature >= 5 && temperature <= 30) return colors.temperature.moderate
  return colors.temperature.poor
}

/**
 * Get temperature color based on recommendation string
 */
export function getTemperatureRecommendationColor(
  recommendation: 'good' | 'moderate' | 'poor' | null | undefined,
): string {
  if (!recommendation) return colors.temperature.unknown
  return colors.temperature[recommendation]
}

/**
 * Get weather/condition icon component based on condition string
 */
export function getWeatherIcon(condition: string | undefined): IconComponent {
  const normalizedCondition = condition?.toLowerCase()
  switch (normalizedCondition) {
    case 'sun':
    case 'sunny':
      return SunnyIcon
    case 'cloudy':
      return CloudIcon
    case 'partial':
    case 'partly_cloudy':
      return PartlySunnyIcon
    default:
      return SunnyIcon
  }
}

/**
 * Get condition icon component based on condition type
 * Used for weather condition display (sun, shade, partial, cloudy)
 */
export function getConditionIcon(
  condition: 'sun' | 'shade' | 'partial' | 'cloudy' | undefined,
): IconComponent {
  switch (condition) {
    case 'sun':
      return SunnyIcon
    case 'shade':
      return CloudIcon
    case 'partial':
      return PartlySunnyIcon
    case 'cloudy':
      return CloudyIcon
    default:
      return SunnyIcon
  }
}

/**
 * Get protection icon component and color based on protection rating
 */
export function getProtectionIconAndColor(rating: ProtectionRating): {
  Icon: IconComponent
  color: string
} {
  switch (rating) {
    case 'well-protected':
      return {
        Icon: ShieldCheckmarkIcon,
        color: colors.protection.wellProtected,
      }
    case 'spaced':
      return { Icon: AlertIcon, color: colors.protection.spaced }
    case 'runout':
      return { Icon: WarningIcon, color: colors.protection.runout }
    default:
      return { Icon: ShieldOutlineIcon, color: colors.protection.normal }
  }
}

/**
 * Get family-friendly icon component and color based on tag
 */
export function getFamilyIconAndColor(tagFamily: string | null | undefined): {
  Icon: IconComponent
  color: string
} {
  if (tagFamily === 'KID_FRIENDLY') {
    return { Icon: HappyOutlineIcon, color: colors.status.success }
  }
  if (tagFamily === 'NOT_KID_FRIENDLY') {
    return { Icon: WarningOutlineIcon, color: colors.status.warning }
  }
  return { Icon: HappyOutlineIcon, color: colors.status.neutral }
}
