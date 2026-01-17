import { memo, useCallback } from 'react'
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native'
import { haptics } from '@/services/haptics'
import { StarRating } from '@/components/shared/StarRating'
import { SectorCardImage } from './SectorCardImage'
import { SectorCardWeatherRow } from './SectorCardWeatherRow'
import { SectorCardRoutesInfo } from './SectorCardRoutesInfo'
import type { SectorUI } from '@/types/ui'

interface SectorCardProps {
  /** Sector data to display */
  sector: SectorUI
  /** Press handler for card tap (navigates to sector detail) */
  onPress?: () => void
  /** Whether this card is currently selected */
  isSelected?: boolean
}

/**
 * Opens external navigation app with the given coordinates.
 */
function openExternalNavigation(latitude: number, longitude: number) {
  const destination = `${latitude},${longitude}`
  const url = Platform.select({
    ios: `maps:?daddr=${destination}`,
    android: `google.navigation:q=${destination}`,
  })

  if (url) {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url)
      } else {
        // Fallback to Google Maps web URL
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        )
      }
    })
  }
}

/**
 * Full-width sector card with vertical layout.
 * Displays sector image, name, location, weather conditions, and routes info.
 * Optimized for FlatList rendering with memo.
 */
export const SectorCard = memo(function SectorCard({
  sector,
  onPress,
  isSelected = false,
}: SectorCardProps) {
  const handlePress = useCallback(() => {
    haptics.light()
    onPress?.()
  }, [onPress])

  const handleNavigatePress = useCallback(() => {
    if (sector.latitude != null && sector.longitude != null) {
      openExternalNavigation(sector.latitude, sector.longitude)
    }
  }, [sector.latitude, sector.longitude])

  const hasCoordinates = sector.latitude != null && sector.longitude != null

  // Use qualityRating, overallScore, or 0 as fallback for star rating
  const starRating = sector.qualityRating ?? sector.overallScore ?? 0

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      className={`bg-card rounded-2xl overflow-hidden mb-4 mx-4 border ${
        isSelected ? 'border-accent' : 'border-border'
      }`}
    >
      {/* Image Section with Best Match Badge */}
      <SectorCardImage
        imageUrl={sector.imageUrl}
        isBestMatch={sector.isBestMatch}
      />

      {/* Content Section */}
      <View className="p-4">
        {/* Name Row with Star Rating */}
        <View className="flex-row items-center justify-between">
          <Text
            className="text-white text-xl font-bold flex-1 mr-2"
            numberOfLines={1}
          >
            {sector.name}
          </Text>
          {starRating > 0 && (
            <StarRating rating={starRating} maxStars={3} size={14} />
          )}
        </View>
        {sector.location && (
          <Text className="text-accent text-sm mt-0.5" numberOfLines={1}>
            {sector.location}
          </Text>
        )}

        {/* Weather Indicators Row */}
        <View className="mt-3">
          <SectorCardWeatherRow
            temperature={sector.temperature}
            condition={sector.condition}
            distanceKm={sector.distanceKm}
          />
        </View>

        {/* Routes Info with GPS Navigation Button */}
        <SectorCardRoutesInfo
          routeCount={sector.routeCount}
          gradeRange={sector.gradeRange}
          onNavigatePress={hasCoordinates ? handleNavigatePress : undefined}
        />
      </View>
    </TouchableOpacity>
  )
})
