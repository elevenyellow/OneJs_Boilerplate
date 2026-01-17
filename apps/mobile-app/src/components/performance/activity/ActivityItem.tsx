import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { StarRating } from '@/components/shared'
import type { ClimbActivity } from '../types'

interface ActivityItemProps {
  activity: ClimbActivity
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const { t } = useTranslation()

  // Check if dateLabel is a translation key
  const displayDate = activity.dateLabel.startsWith('performance.')
    ? t(activity.dateLabel)
    : activity.dateLabel

  return (
    <View className="bg-card rounded-xl p-3 flex-row items-center mx-4 mb-2">
      {/* Grade badge */}
      <View
        style={{ backgroundColor: activity.gradeColor }}
        className="w-12 h-12 rounded-lg items-center justify-center mr-3"
      >
        <Text className="text-white font-bold text-sm">{activity.grade}</Text>
      </View>

      {/* Route info */}
      <View className="flex-1">
        <Text className="text-white font-semibold" numberOfLines={1}>
          {activity.routeName}
        </Text>
        <Text className="text-gray-400 text-xs mt-0.5">
          {activity.style} • {activity.cragName}
        </Text>
      </View>

      {/* Stars and date */}
      <View className="items-end">
        <StarRating rating={activity.stars} maxStars={3} size={12} />
        <Text className="text-gray-500 text-xs mt-1">{displayDate}</Text>
      </View>
    </View>
  )
}
