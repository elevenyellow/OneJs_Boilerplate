import { View, Text } from 'react-native'
import {
  LayersOutlineIcon,
  HappyOutlineIcon,
  SunnyIcon,
  PeopleOutlineIcon,
  CloseIcon,
} from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import type { SectorWithPhoto } from '../types'

interface TagsDetailSectionProps {
  sector: SectorWithPhoto
}

export function TagsDetailSection({ sector }: TagsDetailSectionProps) {
  // Determine if family tag is negative
  const isNegativeFamily = sector.tagFamily === 'NOT_KID_FRIENDLY'

  // Determine if crowds tag is negative
  const isNegativeCrowds = 
    sector.tagCrowds === 'BUSY' || 
    sector.tagCrowds === 'CROWDED'

  // Get appropriate color for family tag
  const getFamilyColor = () => {
    if (isNegativeFamily) return colors.status.error
    return colors.status.success
  }

  // Get appropriate color and icon for crowds
  const getCrowdsColor = () => {
    if (sector.tagCrowds === 'CROWDED') return colors.crowds.crowded // red
    if (sector.tagCrowds === 'BUSY') return colors.crowds.busy // orange
    if (sector.tagCrowds === 'DESERTED') return colors.crowds.deserted // green
    return colors.accent.DEFAULT // default cyan
  }

  return (
    <View className="mx-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <LayersOutlineIcon size={16} color={colors.accent.DEFAULT} />
        <Text className="text-white text-base font-semibold ml-2">
          Tags & Conditions
        </Text>
      </View>

      <View className="bg-card border border-border-muted rounded-lg p-3">
        <View className="flex-row flex-wrap gap-1.5">
          {/* Climbing Style */}
          {sector.climbingStyle && (
            <View className="flex-row items-center bg-card-elevated px-2.5 py-1.5 rounded-full">
              <LayersOutlineIcon size={12} color={colors.accent.DEFAULT} />
              <Text className="text-gray-300 text-[11px] ml-1.5">
                {sector.climbingStyle}
              </Text>
            </View>
          )}

          {/* Weather Labels */}
          {sector.weatherLabels &&
            sector.weatherLabels.map((label, index) => (
              <View
                key={`weather-${index}`}
                className="flex-row items-center bg-card-elevated px-2.5 py-1.5 rounded-full"
              >
                <SunnyIcon size={12} color={colors.condition.sol} />
                <Text className="text-gray-300 text-[11px] ml-1.5">
                  {label}
                </Text>
              </View>
            ))}

          {/* Crowds */}
          {sector.crowdsLabel && (
            <View 
              style={{
                backgroundColor: isNegativeCrowds ? `${getCrowdsColor()}20` : 'rgb(31, 41, 55)'
              }}
              className="flex-row items-center px-2.5 py-1.5 rounded-full"
            >
              <PeopleOutlineIcon size={12} color={getCrowdsColor()} />
              <Text 
                style={{ color: isNegativeCrowds ? getCrowdsColor() : 'rgb(209, 213, 219)' }}
                className="text-[11px] ml-1.5"
              >
                {sector.crowdsLabel}
              </Text>
            </View>
          )}

          {/* Family */}
          {sector.familyLabel && (
            <View 
              style={{
                backgroundColor: isNegativeFamily ? `${colors.status.error}20` : 'rgb(31, 41, 55)'
              }}
              className="flex-row items-center px-2.5 py-1.5 rounded-full"
            >
              {isNegativeFamily ? (
                <CloseIcon size={12} color={colors.status.error} />
              ) : (
                <HappyOutlineIcon size={12} color={colors.status.success} />
              )}
              <Text 
                style={{ color: isNegativeFamily ? colors.status.error : colors.status.success }}
                className="text-[11px] ml-1.5"
              >
                {sector.familyLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
