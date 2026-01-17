import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'

type NotificationType = 'success' | 'error' | 'info'

interface NotificationConfig {
  bg: string
  icon: keyof typeof Ionicons.glyphMap
}

const notificationColors: Record<NotificationType, NotificationConfig> = {
  success: {
    bg: '#10B981',
    icon: 'checkmark-circle',
  },
  error: {
    bg: '#EF4444',
    icon: 'close-circle',
  },
  info: {
    bg: '#3B82F6',
    icon: 'information-circle',
  },
}

/**
 * Custom notification card component
 */
export function CustomNotification({
  title,
  description,
  type,
}: {
  title?: string
  description?: string
  type: NotificationType
}) {
  const config = notificationColors[type]

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
        },
      ]}
    >
      <Ionicons name={config.icon} size={24} color="#FFFFFF" style={styles.icon} />
      <View style={styles.textContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.95,
    marginTop: 4,
  },
})
