import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  HappyOutlineIcon,
  WarningOutlineIcon,
  PersonOutlineIcon,
  PersonIcon,
  PeopleOutlineIcon,
  PeopleIcon,
  CompassOutlineIcon,
  ThermometerOutlineIcon,
  SunnyIcon,
  CloudIcon,
  PartlySunnyIcon,
  MapOutlineIcon,
  CloseIcon,
  LeafOutlineIcon,
  BanOutlineIcon,
  CheckIcon,
} from '@/components/shared/icons'
import { colors } from '@/theme/colors'

interface SectorIconsLegendProps {
  visible: boolean
  onClose: () => void
}

interface LegendItem {
  icon: React.ReactNode
  labelKey: string
  descriptionKey: string
}

function LegendSection({
  title,
  items,
}: {
  title: string
  items: LegendItem[]
}) {
  const { t } = useTranslation()

  return (
    <View className="mb-4">
      <Text className="text-white font-semibold mb-2">{title}</Text>
      {items.map((item, index) => (
        <View
          key={index}
          className="flex-row items-center py-2 border-b border-gray-800"
        >
          <View className="w-8 items-center">{item.icon}</View>
          <View className="flex-1 ml-3">
            <Text className="text-white text-sm">{t(item.labelKey)}</Text>
            <Text className="text-gray-400 text-xs">
              {t(item.descriptionKey)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

export function SectorIconsLegend({
  visible,
  onClose,
}: SectorIconsLegendProps) {
  const { t } = useTranslation()

  const familyItems: LegendItem[] = [
    {
      icon: <HappyOutlineIcon size={20} color={colors.status.success} />,
      labelKey: 'legend.kidFriendly',
      descriptionKey: 'legend.kidFriendlyDescription',
    },
    {
      icon: <WarningOutlineIcon size={20} color={colors.status.warning} />,
      labelKey: 'legend.notKidFriendly',
      descriptionKey: 'legend.notKidFriendlyDescription',
    },
  ]

  const crowdsItems: LegendItem[] = [
    {
      icon: <PersonOutlineIcon size={20} color={colors.crowds.deserted} />,
      labelKey: 'legend.deserted',
      descriptionKey: 'legend.desertedDescription',
    },
    {
      icon: <PersonIcon size={20} color={colors.crowds.quiet} />,
      labelKey: 'legend.quiet',
      descriptionKey: 'legend.quietDescription',
    },
    {
      icon: <PeopleOutlineIcon size={20} color={colors.crowds.busy} />,
      labelKey: 'legend.crowded',
      descriptionKey: 'legend.crowdedDescription',
    },
    {
      icon: <PeopleIcon size={20} color={colors.crowds.crowded} />,
      labelKey: 'legend.veryBusy',
      descriptionKey: 'legend.veryBusyDescription',
    },
  ]

  const orientationItems: LegendItem[] = [
    {
      icon: (
        <View className="flex-row items-center">
          <CompassOutlineIcon size={18} color={colors.text.muted} />
          <Text className="text-gray-400 text-xs ml-0.5">N</Text>
        </View>
      ),
      labelKey: 'legend.orientation',
      descriptionKey: 'legend.orientationDescription',
    },
  ]

  const temperatureItems: LegendItem[] = [
    {
      icon: (
        <ThermometerOutlineIcon size={20} color={colors.temperature.good} />
      ),
      labelKey: 'legend.idealTemperature',
      descriptionKey: 'legend.idealTemperatureDescription',
    },
    {
      icon: (
        <ThermometerOutlineIcon size={20} color={colors.temperature.moderate} />
      ),
      labelKey: 'legend.moderateTemperature',
      descriptionKey: 'legend.moderateTemperatureDescription',
    },
    {
      icon: (
        <ThermometerOutlineIcon size={20} color={colors.temperature.poor} />
      ),
      labelKey: 'legend.notRecommendedTemperature',
      descriptionKey: 'legend.notRecommendedTemperatureDescription',
    },
  ]

  const weatherItems: LegendItem[] = [
    {
      icon: <SunnyIcon size={20} color={colors.condition.sol} />,
      labelKey: 'legend.sunny',
      descriptionKey: 'legend.sunnyDescription',
    },
    {
      icon: <PartlySunnyIcon size={20} color={colors.condition.sol} />,
      labelKey: 'legend.partlyCloudy',
      descriptionKey: 'legend.partlyCloudyDescription',
    },
    {
      icon: <CloudIcon size={20} color={colors.condition.nublado} />,
      labelKey: 'legend.cloudy',
      descriptionKey: 'legend.cloudyDescription',
    },
  ]

  const seasonItems: LegendItem[] = [
    {
      icon: <LeafOutlineIcon size={20} color={colors.status.success} />,
      labelKey: 'legend.inSeason',
      descriptionKey: 'legend.inSeasonDescription',
    },
    {
      icon: <BanOutlineIcon size={20} color={colors.text.muted} />,
      labelKey: 'legend.offSeason',
      descriptionKey: 'legend.offSeasonDescription',
    },
  ]

  const ascentItems: LegendItem[] = [
    {
      icon: (
        <View
          className="w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: `${colors.grade.easy}80` }}
        >
          <CheckIcon size={12} color={colors.text.primary} />
        </View>
      ),
      labelKey: 'legend.ascentSingle',
      descriptionKey: 'legend.ascentSingleDescription',
    },
    {
      icon: (
        <View
          className="w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.accent.DEFAULT }}
        >
          <Text className="text-white text-xs font-bold">2</Text>
        </View>
      ),
      labelKey: 'legend.ascentMultiple',
      descriptionKey: 'legend.ascentMultipleDescription',
    },
  ]

  const otherItems: LegendItem[] = [
    {
      icon: <MapOutlineIcon size={20} color={colors.accent.DEFAULT} />,
      labelKey: 'legend.topoAvailable',
      descriptionKey: 'legend.topoAvailableDescription',
    },
  ]

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-card rounded-t-3xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
            <Text className="text-white text-lg font-bold">
              {t('legend.iconLegend')}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <CloseIcon size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="p-4">
            <LegendSection
              title={t('legend.familyFriendly')}
              items={familyItems}
            />
            <LegendSection title={t('legend.crowdLevel')} items={crowdsItems} />
            <LegendSection
              title={t('legend.orientation')}
              items={orientationItems}
            />
            <LegendSection
              title={t('legend.temperatureRecommendation')}
              items={temperatureItems}
            />
            <LegendSection
              title={t('legend.currentWeather')}
              items={weatherItems}
            />
            <LegendSection
              title={t('legend.seasonality')}
              items={seasonItems}
            />
            <LegendSection
              title={t('legend.ascents')}
              items={ascentItems}
            />
            <LegendSection title={t('legend.other')} items={otherItems} />

            {/* Bottom spacing */}
            <View className="h-8" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
