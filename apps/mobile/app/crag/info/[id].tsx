import { Colors } from '@/constants/Colors'
import { useCragDetail } from '@/hooks/useCragDetail'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function formatInfoText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold** -> bold
    .replace(/__([^_]+)__/g, '$1') // __bold__ -> bold
    .replace(/\*([^*]+)\*/g, '$1') // *italic* -> italic
    .replace(/_([^_]+)_/g, '$1') // _italic_ -> italic
    .replace(/^#+\s*/gm, '') // # headers -> text
    .replace(/^-\s+/gm, '• ') // - list items -> bullet points
    .replace(/&nbsp;/g, ' ') // &nbsp; -> space
    .replace(/:parking:/g, '🅿️') // :parking: -> emoji
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines -> double newline
    .trim()
}

export default function InfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const { data: crag, isLoading } = useCragDetail(id)

  const handleOpenTheCrag = () => {
    if (crag?.theCragUrl) {
      Linking.openURL(crag.theCragUrl)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!crag) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Info not available</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {crag.name}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Description */}
        {crag.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Description
              </Text>
            </View>
            <View style={[styles.textContainer, { backgroundColor: colors.muted }]}>
              <Text style={[styles.text, { color: colors.text }]}>
                {formatInfoText(crag.description)}
              </Text>
            </View>
          </View>
        )}

        {/* Approach */}
        {crag.approach && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="walk-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Approach
              </Text>
            </View>
            <View style={[styles.textContainer, { backgroundColor: colors.muted }]}>
              <Text style={[styles.text, { color: colors.text }]}>
                {formatInfoText(crag.approach)}
              </Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Stats
            </Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {crag.totalSectors || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Sectors
              </Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {crag.totalRoutes || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Routes
              </Text>
            </View>
            {crag.altitude && (
              <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {crag.altitude}m
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Altitude
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Coordinates */}
        {crag.latitude && crag.longitude && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Location
              </Text>
            </View>
            <View style={[styles.textContainer, { backgroundColor: colors.muted }]}>
              <Text style={[styles.text, { color: colors.text }]}>
                {crag.latitude.toFixed(6)}, {crag.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* TheCrag Link */}
        {crag.theCragUrl && (
          <Pressable
            onPress={handleOpenTheCrag}
            style={[styles.linkButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="open-outline" size={20} color="#FFF" />
            <Text style={styles.linkButtonText}>
              View on TheCrag
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  textContainer: {
    padding: 16,
    borderRadius: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flex: 1,
    minWidth: 80,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 32,
    marginBottom: 32,
  },
  linkButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
