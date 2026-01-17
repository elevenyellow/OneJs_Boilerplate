import { View, Text, TouchableOpacity, Modal } from 'react-native'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colors } from '@/theme/colors'
import {
  LeafOutlineIcon,
  MapOutlineIcon,
  LocationOutlineIcon,
  HelpCircleOutlineIcon,
  CloseIcon,
  SpeedometerOutlineIcon,
  StarIcon,
} from '@/components/shared/icons'

interface LegendItem {
  icon: React.ReactNode
  label: string
  color: string
}

/**
 * Legend button that shows a modal with badge explanations
 * Displays a "?" icon that opens a modal with all badge meanings
 */
export const BadgesLegend = memo(function BadgesLegend() {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  const legendItems: LegendItem[] = [
    {
      icon: <SpeedometerOutlineIcon size={16} color={colors.accent.DEFAULT} />,
      label: t('legend.matchScore'),
      color: colors.accent.DEFAULT,
    },
    {
      icon: <StarIcon size={16} color={colors.grade.medium} />,
      label: t('legend.qualityRating'),
      color: colors.grade.medium,
    },
    {
      icon: <LocationOutlineIcon size={16} color={colors.text.secondary} />,
      label: t('legend.distance'),
      color: colors.text.secondary,
    },
    {
      icon: <LeafOutlineIcon size={16} color={colors.status.success} />,
      label: t('legend.inSeasonDescription'),
      color: colors.status.success,
    },
    {
      icon: <MapOutlineIcon size={16} color={colors.accent.DEFAULT} />,
      label: t('legend.topoAvailableDescription'),
      color: colors.accent.DEFAULT,
    },
    {
      icon: <Text style={{ fontSize: 14 }}>🧗</Text>,
      label: t('legend.sportClimbing'),
      color: colors.status.info,
    },
    {
      icon: <Text style={{ fontSize: 14 }}>🪨</Text>,
      label: t('legend.bouldering'),
      color: colors.status.warning,
    },
  ]

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="h-8 w-8 items-center justify-center rounded-full bg-card"
        activeOpacity={0.7}
      >
        <HelpCircleOutlineIcon size={18} color={colors.text.secondary} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-center items-center px-6"
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View
            className="bg-card rounded-2xl w-full max-w-sm p-4"
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-semibold">
                {t('legend.title')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="p-1"
              >
                <CloseIcon size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Legend items */}
            <View className="gap-3">
              {legendItems.map((item, index) => (
                <View key={index} className="flex-row items-center gap-3">
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    {item.icon}
                  </View>
                  <Text className="text-gray-300 text-sm flex-1">
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
})
