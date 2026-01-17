import { View } from 'react-native'
import { ActivityHeader } from './ActivityHeader'
import { ActivityItem } from './ActivityItem'
import type { ClimbActivity } from '../types'

interface ActivityListProps {
  activities: ClimbActivity[]
  onViewAll?: () => void
}

export function ActivityList({ activities, onViewAll }: ActivityListProps) {
  return (
    <View className="mt-4">
      <ActivityHeader onViewAll={onViewAll} />
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </View>
  )
}
