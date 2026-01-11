import { Colors } from '@/constants/Colors'
import { getLanguageInfo, parseApproachByLanguage, t } from '@/lib/i18n'
import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useMemo, useState } from 'react'
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

interface LanguageApproachSectionProps {
  approach: string
  latitude?: number | null
  longitude?: number | null
  cragName?: string
}

export function LanguageApproachSection({
  approach,
  latitude,
  longitude,
  cragName,
}: LanguageApproachSectionProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  // Parse approach text by language
  const languageContent = useMemo(
    () => parseApproachByLanguage(approach),
    [approach],
  )

  // Get available languages
  const availableLanguages = useMemo(
    () => Object.keys(languageContent),
    [languageContent],
  )

  // Check if we have multiple languages
  const hasMultipleLanguages =
    availableLanguages.length > 1 ||
    (availableLanguages.length === 1 && availableLanguages[0] !== 'default')

  // Selected language state
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    // Default to English if available, then first available language
    if (languageContent['en']) return 'en'
    if (languageContent['gb']) return 'gb'
    if (languageContent['default']) return 'default'
    return availableLanguages[0] || 'default'
  })

  // Animation for content height
  const contentHeight = useSharedValue(1)
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentHeight.value,
    transform: [{ scaleY: contentHeight.value }],
  }))

  const handleLanguagePress = useCallback(
    (lang: string) => {
      if (lang === selectedLanguage) return

      // Animate out
      contentHeight.value = withTiming(0, { duration: 150 }, () => {
        // Animate in with new content
        contentHeight.value = withTiming(1, { duration: 200 })
      })

      // Change language after brief delay
      setTimeout(() => {
        setSelectedLanguage(lang)
      }, 150)
    },
    [selectedLanguage, contentHeight],
  )

  const handleOpenMaps = useCallback(() => {
    if (latitude && longitude) {
      const url = Platform.select({
        ios: `maps:0,0?q=${cragName || 'Location'}@${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${cragName || 'Location'})`,
      })
      if (url) Linking.openURL(url)
    }
  }, [latitude, longitude, cragName])

  // Get current content
  const currentContent = languageContent[selectedLanguage] || ''

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <Text style={[styles.title, { color: colors.text }]}>
        {t('howToGetThere')}
      </Text>

      {/* Language selector (only if multiple languages) */}
      {hasMultipleLanguages && (
        <View style={styles.languageSelector}>
          {availableLanguages
            .filter((lang) => lang !== 'default')
            .map((lang) => {
              const { flag, name } = getLanguageInfo(lang)
              const isSelected = lang === selectedLanguage

              return (
                <Pressable
                  key={lang}
                  style={[
                    styles.languageButton,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.muted,
                      borderColor: isSelected
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => handleLanguagePress(lang)}
                >
                  <Text style={styles.languageFlag}>{flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      {
                        color: isSelected
                          ? colors.primaryForeground
                          : colors.text,
                      },
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              )
            })}
        </View>
      )}

      {/* Content */}
      <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
        <Text style={[styles.content, { color: colors.textSecondary }]}>
          {currentContent}
        </Text>
      </Animated.View>

      {/* Open in maps button */}
      {latitude && longitude && (
        <Pressable
          style={[styles.mapButton, { backgroundColor: colors.primary }]}
          onPress={handleOpenMaps}
        >
          <Ionicons
            name="navigate"
            size={18}
            color={colors.primaryForeground}
          />
          <Text
            style={[styles.mapButtonText, { color: colors.primaryForeground }]}
          >
            {t('openInMaps')}
          </Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  languageSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  languageFlag: {
    fontSize: 18,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    overflow: 'hidden',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  mapButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
})
