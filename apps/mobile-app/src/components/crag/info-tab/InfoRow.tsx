import { View, Platform, Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  MapOutlineIcon,
  ResizeOutlineIcon,
  StarIcon,
} from '@/components/shared/icons'
import { CompactBlock } from './CompactBlock'
import { colors } from '@/theme/colors'
import type { SectorWithPhoto } from '../types'

interface InfoRowProps {
  sector: SectorWithPhoto
}

export function InfoRow({ sector }: InfoRowProps) {
  const { t } = useTranslation()

  // Handle Google Maps navigation
  const handleOpenMaps = () => {
    if (!sector.latitude || !sector.longitude) return

    const { latitude, longitude } = sector
    const label = encodeURIComponent(sector.name || 'Sector')

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    })

    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        )
      })
    }
  }

  return (
    <View className="flex-row gap-2 mx-4 mb-4">
      {/* Block 1: Directions (Open in Maps) */}
      {sector.latitude && sector.longitude && (
        <CompactBlock
          icon={<MapOutlineIcon size={18} color={colors.accent.DEFAULT} />}
          value={t('approach.directions')}
          label=""
          onPress={handleOpenMaps}
        />
      )}

      {/* Block 2: Route Height */}
      {sector.averageHeight && (
        <CompactBlock
          icon={<ResizeOutlineIcon size={18} color={colors.accent.DEFAULT} />}
          value={`${sector.averageHeight}m`}
          label={t('sector.labels.height')}
        />
      )}

      {/* Block 3: Sector Stats (Kudos) */}
      {sector.kudos !== null && sector.kudos !== undefined && (
        <CompactBlock
          icon={<StarIcon size={18} color={colors.accent.DEFAULT} />}
          value={sector.kudos}
          label={t('sector.statistics.kudos')}
        />
      )}
    </View>
  )
}
