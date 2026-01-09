import { Colors } from '@/constants/Colors'
import type { CragWithSectors } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'

interface CragGroupProps {
  cragWithSectors: CragWithSectors
}

export function CragGroup({ cragWithSectors }: CragGroupProps) {
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const { crag, sectors, distance, totalRoutesInRange, avgRelevanceScore, totalSectorsInCrag } =
    cragWithSectors

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // Navigate to crag detail page with pre-scored sectors data
    router.push({
      pathname: `/crag/${crag.id}`,
      params: {
        // Pass essential data that's already scored by backend
        sectorsData: JSON.stringify(sectors),
        avgScore: avgRelevanceScore.toString(),
        distance: distance.toString(),
      },
    })
  }

  // Format distance nicely
  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)} m`
    return `${km.toFixed(1)} km`
  }

  // Get gradient based on score
  const getScoreGradient = (score: number): [string, string] => {
    if (score >= 75) return ['#10B981', '#059669']
    if (score >= 50) return ['#F59E0B', '#D97706']
    if (score >= 25) return ['#EF4444', '#DC2626']
    return ['#64748B', '#475569']
  }

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Score gradient bar on left */}
      <LinearGradient
        colors={getScoreGradient(avgRelevanceScore)}
        style={styles.scoreBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Ionicons name="layers" size={22} color={colors.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text
                style={[styles.cragName, { color: colors.text }]}
                numberOfLines={1}
              >
                {crag.name}
              </Text>
              {/* Location info */}
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                >
                  {formatDistance(distance)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Score badge */}
            <View style={styles.scoreBadgeWrapper}>
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: getScoreColor(avgRelevanceScore) },
                ]}
              >
                <Text style={styles.scoreText}>
                  {Math.round(avgRelevanceScore)}
                </Text>
              </View>
              <Text
                style={[styles.scoreLabel, { color: colors.textSecondary }]}
              >
                match
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={colors.textSecondary}
            />
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.muted }]}>
          <View style={styles.stat}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Ionicons name="grid" size={14} color={colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {sectors.length}/{totalSectorsInCrag}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                sectors
              </Text>
            </View>
          </View>

          <View
            style={[styles.statDivider, { backgroundColor: colors.border }]}
          />

          <View style={styles.stat}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.accent + '20' },
              ]}
            >
              <Ionicons name="git-branch" size={14} color={colors.accent} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalRoutesInRange}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                in range
              </Text>
            </View>
          </View>

          <View
            style={[styles.statDivider, { backgroundColor: colors.border }]}
          />

          <View style={styles.stat}>
            <View
              style={[styles.statIcon, { backgroundColor: '#F59E0B' + '20' }]}
            >
              <Ionicons name="star" size={14} color="#D97706" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {crag.totalFavorites || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                favorites
              </Text>
            </View>
          </View>
        </View>

        {/* Quick badges */}
        <View style={styles.badgesRow}>
          {crag.hasTopo && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary + '30',
                },
              ]}
            >
              <Ionicons name="map" size={12} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                Topo
              </Text>
            </View>
          )}
          {crag.numberPhotos !== null && crag.numberPhotos > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Ionicons name="camera" size={12} color={colors.textSecondary} />
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {crag.numberPhotos}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#10B981' // emerald
  if (score >= 50) return '#F59E0B' // amber
  if (score >= 25) return '#EF4444' // red
  return '#64748B' // slate
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreBar: {
    width: 4,
    minHeight: '100%',
  },
  headerContent: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  cragName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreBadgeWrapper: {
    alignItems: 'center',
    gap: 2,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 42,
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
