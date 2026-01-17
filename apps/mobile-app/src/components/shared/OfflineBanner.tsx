/**
 * Offline Banner Component
 * Displays when device is offline with pending request count
 */

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { CloudOfflineIcon, SyncIcon } from '@/components/shared/icons'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { colors } from '@/theme/colors'

/**
 * Props for OfflineBanner
 */
interface OfflineBannerProps {
  /** Custom message to display (default: "You're offline") */
  message?: string
  /** Whether to show pending request count */
  showPendingCount?: boolean
  /** Callback when banner is tapped */
  onPress?: () => void
}

/**
 * Banner that appears when device loses network connectivity
 *
 * Features:
 * - Automatic show/hide based on network state
 * - Displays pending request count
 * - Tappable for refresh or additional actions
 *
 * @example
 * ```tsx
 * // In a screen component
 * <View className="flex-1">
 *   <OfflineBanner />
 *   <MainContent />
 * </View>
 * ```
 */
export function OfflineBanner({
  message = "You're offline",
  showPendingCount = true,
  onPress,
}: OfflineBannerProps): React.ReactElement | null {
  const { isOnline, pendingRequests, refresh } = useNetworkStatus()

  // Don't render if online and no pending requests
  if (isOnline && pendingRequests === 0) {
    return null
  }

  const handlePress = async () => {
    if (onPress) {
      onPress()
    } else {
      await refresh()
    }
  }

  // Show "syncing" state when back online but still have pending
  const isSyncing = isOnline && pendingRequests > 0

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="alert"
      accessibilityLabel={
        isSyncing
          ? `Syncing ${pendingRequests} pending requests`
          : `${message}. ${pendingRequests} requests pending`
      }
    >
      <View
        style={{
          backgroundColor: isSyncing
            ? colors.status.info
            : colors.status.warning,
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {isSyncing ? (
          <SyncIcon size={18} color={colors.text.primary} />
        ) : (
          <CloudOfflineIcon size={18} color={colors.text.primary} />
        )}

        <Text
          style={{
            color: colors.text.primary,
            fontSize: 14,
            fontWeight: '500',
          }}
        >
          {isSyncing ? 'Syncing...' : message}
        </Text>

        {showPendingCount && pendingRequests > 0 && (
          <View
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {pendingRequests}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

/**
 * Compact offline indicator for inline use
 */
export function OfflineIndicator(): React.ReactElement | null {
  const { isOnline } = useNetworkStatus()

  if (isOnline) {
    return null
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: colors.status.warning,
        borderRadius: 12,
      }}
    >
      <CloudOfflineIcon size={12} color={colors.text.primary} />
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 11,
          fontWeight: '500',
        }}
      >
        Offline
      </Text>
    </View>
  )
}
