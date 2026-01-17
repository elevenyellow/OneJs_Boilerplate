/**
 * Route Header Card
 *
 * Displays route information at the top of the Log Ascent screen.
 * Shows route image, name, grade, and location.
 */

import { View, Text, Image } from 'react-native'
import { LocationIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'

interface RouteHeaderCardProps {
  routeName: string
  routeGrade: string
  routeGradeSecondary?: string
  routeImage?: string
  location: string
}

export function RouteHeaderCard({
  routeName,
  routeGrade,
  routeGradeSecondary,
  routeImage,
  location,
}: RouteHeaderCardProps) {
  return (
    <View className="bg-card rounded-2xl border border-border-muted p-4 mx-4 mb-6">
      <View className="flex-row">
        {/* Route Image */}
        {routeImage ? (
          <Image
            source={{ uri: routeImage }}
            className="w-20 h-20 rounded-xl mr-4"
            resizeMode="cover"
          />
        ) : (
          <View className="w-20 h-20 rounded-xl mr-4 bg-card-elevated items-center justify-center">
            <Text className="text-gray-500 text-2xl">🧗</Text>
          </View>
        )}

        {/* Route Info */}
        <View className="flex-1 justify-center">
          <Text className="text-white text-xl font-bold" numberOfLines={1}>
            {routeName}
          </Text>

          <View className="flex-row items-center mt-1">
            <Text className="text-accent text-lg font-semibold">
              {routeGrade}
            </Text>
            {routeGradeSecondary && (
              <Text className="text-gray-400 text-base ml-2">
                ({routeGradeSecondary})
              </Text>
            )}
          </View>

          <View className="flex-row items-center mt-1">
            <LocationIcon size={14} color={colors.text.secondary} />
            <Text className="text-gray-400 text-sm ml-1" numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
