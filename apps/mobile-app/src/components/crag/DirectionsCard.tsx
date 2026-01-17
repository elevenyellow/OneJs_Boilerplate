import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  LocationIcon,
  WalkIcon,
  FootstepsIcon,
  NavigateIcon,
  NavigateCircleOutlineIcon,
  CopyOutlineIcon,
} from '@/components/shared/icons'
import { colors } from '@/theme/colors'

type IconComponent = React.ComponentType<{ size?: number; color?: string }>

interface DirectionsCardProps {
  title: string
  subtitle?: string
  value?: string
  Icon: IconComponent
  iconColor: string
  iconBackgroundColor: string
  children?: React.ReactNode
}

export function DirectionsCard({
  title,
  subtitle,
  value,
  Icon,
  iconColor,
  iconBackgroundColor,
  children,
}: DirectionsCardProps) {
  return (
    <View className="bg-card rounded-xl p-4 mx-4 mt-4">
      <View className="flex-row items-center gap-3">
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: iconBackgroundColor }}
        >
          <Icon size={24} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-white text-[15px] font-semibold">{title}</Text>
          {subtitle && (
            <Text className="text-gray-400 text-[13px] mt-0.5">{subtitle}</Text>
          )}
          {value && (
            <Text className="text-accent text-base font-semibold mt-0.5">
              {value}
            </Text>
          )}
        </View>
      </View>
      {children}
    </View>
  )
}

interface LocationCardProps {
  name: string
  latitude: number
  longitude: number
  onCopyCoordinates: () => void
  onOpenMaps: () => void
}

export function LocationCard({
  name,
  latitude,
  longitude,
  onCopyCoordinates,
  onOpenMaps,
}: LocationCardProps) {
  const { t } = useTranslation()

  return (
    <DirectionsCard
      title={t('directions.location')}
      subtitle={name}
      Icon={LocationIcon}
      iconColor={colors.status.success}
      iconBackgroundColor="rgba(76, 175, 80, 0.15)"
    >
      <TouchableOpacity
        className="flex-row items-center gap-2 bg-border rounded-lg p-3 mt-3"
        onPress={onCopyCoordinates}
      >
        <NavigateCircleOutlineIcon size={20} color={colors.text.secondary} />
        <Text
          className="flex-1 text-gray-400 text-[13px]"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
        >
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
        <CopyOutlineIcon size={16} color={colors.text.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center justify-center gap-2 bg-accent rounded-[10px] py-3.5 mt-4"
        onPress={onOpenMaps}
      >
        <NavigateIcon size={20} color={colors.text.primary} />
        <Text className="text-white text-[15px] font-semibold">
          {t('directions.navigate')}
        </Text>
      </TouchableOpacity>
    </DirectionsCard>
  )
}

interface WalkTimeCardProps {
  walkInTime: string
}

export function WalkTimeCard({ walkInTime }: WalkTimeCardProps) {
  const { t } = useTranslation()

  return (
    <DirectionsCard
      title={t('directions.walkTime')}
      value={walkInTime}
      Icon={WalkIcon}
      iconColor={colors.icon.navigation}
      iconBackgroundColor="rgba(33, 150, 243, 0.15)"
    />
  )
}

interface ApproachCardProps {
  approach: string
}

export function ApproachCard({ approach }: ApproachCardProps) {
  const { t } = useTranslation()

  return (
    <DirectionsCard
      title={t('directions.accessDescription')}
      Icon={FootstepsIcon}
      iconColor={colors.icon.approach}
      iconBackgroundColor="rgba(255, 152, 0, 0.15)"
    >
      <Text className="text-gray-400 text-sm leading-[22px] mt-3">
        {approach}
      </Text>
    </DirectionsCard>
  )
}
