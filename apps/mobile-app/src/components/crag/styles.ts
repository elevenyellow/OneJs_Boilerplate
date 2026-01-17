import { StyleSheet } from 'react-native'
import { colors } from '@/theme/colors'

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.surface,
  },
  fixedHeader: {
    // Fixed header containing hero image, info card, and tabs
  },
  scrollableContent: {
    flex: 1,
  },
})
