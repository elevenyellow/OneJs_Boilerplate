import { useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native'
import { useTranslation } from 'react-i18next'
import { HelpCircleOutlineIcon, CloseIcon } from '@/components/shared/icons'
// EXCEPTION: Ionicons is used for dynamic icon rendering in legendItems.
// Each legend item has a different icon name from a predefined list.
// Using wrapper components for each would require a mapping function without significant benefit.
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

interface TopoLegendModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean

  /**
   * Callback to close the modal
   */
  onClose: () => void
}

interface LegendItem {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  backgroundColor: string
  title: string
  description: string
}

/**
 * Modal displaying climbing route symbols legend
 */
export function TopoLegendModal({ visible, onClose }: TopoLegendModalProps) {
  const { t } = useTranslation()

  const legendItems: LegendItem[] = useMemo(
    () => [
      {
        icon: 'star',
        iconColor: colors.grade.medium,
        backgroundColor: 'rgba(234, 179, 8, 0.2)',
        title: t('topo.legend.classicRoute.title'),
        description: t('topo.legend.classicRoute.description'),
      },
      {
        icon: 'resize-outline',
        iconColor: colors.text.secondary,
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        title: t('topo.legend.height.title'),
        description: t('topo.legend.height.description'),
      },
      {
        icon: 'ellipse',
        iconColor: colors.text.secondary,
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        title: t('topo.legend.bolts.title'),
        description: t('topo.legend.bolts.description'),
      },
      {
        icon: 'flash',
        iconColor: colors.text.secondary,
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        title: t('topo.legend.style.title'),
        description: t('topo.legend.style.description'),
      },
      {
        icon: 'layers-outline',
        iconColor: colors.text.secondary,
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        title: t('topo.legend.multipitch.title'),
        description: t('topo.legend.multipitch.description'),
      },
      {
        icon: 'shield-checkmark',
        iconColor: colors.protection.wellProtected,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        title: t('topo.legend.wellProtected.title'),
        description: t('topo.legend.wellProtected.description'),
      },
      {
        icon: 'alert',
        iconColor: colors.protection.spaced,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        title: t('topo.legend.spacedProtection.title'),
        description: t('topo.legend.spacedProtection.description'),
      },
      {
        icon: 'warning',
        iconColor: colors.protection.runout,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        title: t('topo.legend.runout.title'),
        description: t('topo.legend.runout.description'),
      },
      {
        icon: 'warning',
        iconColor: colors.status.warning,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        title: t('topo.legend.warning.title'),
        description: t('topo.legend.warning.description'),
      },
      {
        icon: 'construct',
        iconColor: colors.orange.DEFAULT,
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        title: t('topo.legend.maintenance.title'),
        description: t('topo.legend.maintenance.description'),
      },
    ],
    [t],
  )

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />
        <View className="bg-card rounded-t-3xl">
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 py-4"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.border.default,
            }}
          >
            <View className="flex-row items-center gap-2">
              <HelpCircleOutlineIcon size={24} color={colors.text.secondary} />
              <Text className="text-white text-lg font-semibold">
                {t('topo.legendTitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center"
            >
              <CloseIcon size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Symbols legend list */}
          <ScrollView
            className="max-h-96 px-4 py-2"
            showsVerticalScrollIndicator={false}
          >
            {legendItems.map((item, index) => (
              <View
                key={item.title}
                className="flex-row items-center gap-3 py-3"
                style={
                  index < legendItems.length - 1
                    ? {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.bg.elevated,
                      }
                    : undefined
                }
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: item.backgroundColor }}
                >
                  <Ionicons
                    name={item.icon}
                    size={item.icon === 'ellipse' ? 14 : 18}
                    color={item.iconColor}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">{item.title}</Text>
                  <Text className="text-gray-400 text-sm">
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}

            {/* Bottom spacing */}
            <View className="h-6" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
