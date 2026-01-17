import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SyncIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import type { SyncInfo } from '../types'

interface SyncFooterProps {
  sync: SyncInfo
}

export function SyncFooter({ sync }: SyncFooterProps) {
  const { t } = useTranslation()

  const lastSyncText = sync.lastSyncValue
    ? t(sync.lastSyncLabel, { count: sync.lastSyncValue })
    : t(sync.lastSyncLabel)

  return (
    <View className="flex-row items-center justify-center mt-6 mb-4">
      <SyncIcon size={14} color={colors.text.muted} />
      <Text className="text-gray-500 text-xs ml-2 uppercase">
        {t('performance.sync.syncedWith', { source: sync.source })} •{' '}
        {t('performance.sync.updated')} {lastSyncText}
      </Text>
    </View>
  )
}
