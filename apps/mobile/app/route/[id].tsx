import { Colors } from '@/constants/Colors'
import { TopoViewer } from '@/components/TopoViewer'
import { useRouteDetail } from '@/hooks/useRouteDetail'
import { useSectorRoutes } from '@/hooks/useSectorRoutes'
import { useSectorTopos } from '@/hooks/useTopos'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function getGradeColor(grade: string | null): string {
  if (!grade) return '#64748B'
  const gradeNum = parseInt(grade.replace(/[^\d]/g, ''), 10)
  if (gradeNum <= 5) return '#22C55E'
  if (gradeNum <= 6) return '#F59E0B'
  if (gradeNum <= 7) return '#EF4444'
  return '#7C3AED'
}

export default function RouteDetailScreen() {
  const params = useLocalSearchParams<{
    id: string
    sectorId: string
    name?: string
    grade?: string
    height?: string
    stars?: string
    pitches?: string
    bolts?: string
  }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const routeId = params.id
  const sectorId = params.sectorId

  // Fetch full route detail from dedicated endpoint
  const { data: routeDetail, isLoading: isLoadingDetail } = useRouteDetail(
    routeId || '',
    !!routeId,
  )

  // Fetch routes and topos for this sector (for topo display)
  const { data: routesData, isLoading: isLoadingRoutes } = useSectorRoutes(
    sectorId || routeDetail?.sectorId || '',
    undefined,
    !!(sectorId || routeDetail?.sectorId),
  )
  const { data: toposData, isLoading: isLoadingTopos } = useSectorTopos(
    sectorId || routeDetail?.sectorId || '',
    !!(sectorId || routeDetail?.sectorId),
  )

  const allRoutes = routesData?.routes || []
  const topos = toposData?.topos || []
  const isLoading = isLoadingDetail || isLoadingRoutes || isLoadingTopos

  // Merge route detail with params fallback
  const currentRoute = useMemo(() => {
    if (routeDetail) {
      return {
        id: routeDetail.id,
        externalId: routeDetail.externalId,
        sectorId: routeDetail.sectorId,
        name: routeDetail.name,
        grade: routeDetail.grade,
        gradeIndex: routeDetail.gradeIndex,
        height: routeDetail.height,
        pitches: routeDetail.pitches,
        bolts: routeDetail.bolts,
        rating: routeDetail.rating,
        quality: routeDetail.quality,
        ascents: routeDetail.ascents,
        routeType: routeDetail.routeType,
        firstAscent: routeDetail.firstAscent,
        tags: routeDetail.tags || [],
        warnings: routeDetail.warnings || [],
        topoNumber: routeDetail.topoNumber,
        createdAt: routeDetail.createdAt,
      }
    }
    
    // Fallback to params while loading
    return {
      id: routeId,
      externalId: null as number | null,
      sectorId: sectorId || null,
      name: params.name || 'Route',
      grade: params.grade || null,
      gradeIndex: null as number | null,
      height: params.height ? parseInt(params.height, 10) : null,
      pitches: params.pitches ? parseInt(params.pitches, 10) : null,
      bolts: params.bolts ? parseInt(params.bolts, 10) : null,
      rating: params.stars ? parseFloat(params.stars) : null,
      quality: null as number | null,
      ascents: null as number | null,
      routeType: null as string | null,
      firstAscent: null as string | null,
      tags: [] as string[],
      warnings: [] as string[],
      topoNumber: null as string | null,
      createdAt: null as string | null,
    }
  }, [routeDetail, routeId, sectorId, params])


  const gradeColor = getGradeColor(currentRoute.grade)

  // Render stars
  const renderStars = (rating: number | null) => {
    if (rating === null || rating === 0) return null
    const fullStars = Math.min(rating, 3) // Max 3 stars

    return (
      <View style={styles.starsRow}>
        {Array.from({ length: fullStars }, (_, i) => (
          <Ionicons key={i} name="star" size={16} color="#F59E0B" />
        ))}
      </View>
    )
  }

  // Get route type icon
  const getRouteTypeIcon = (type: string | null): keyof typeof Ionicons.glyphMap => {
    switch (type?.toLowerCase()) {
      case 'sport':
        return 'flash-outline'
      case 'trad':
        return 'shield-outline'
      case 'boulder':
        return 'cube-outline'
      case 'mixed':
        return 'git-merge-outline'
      default:
        return 'help-circle-outline'
    }
  }

  // Get warning icon
  const getWarningIcon = (warning: string): keyof typeof Ionicons.glyphMap => {
    const lower = warning.toLowerCase()
    if (lower.includes('loose') || lower.includes('rock')) return 'warning-outline'
    if (lower.includes('runout')) return 'alert-circle-outline'
    if (lower.includes('bee') || lower.includes('wasp')) return 'bug-outline'
    if (lower.includes('bird') || lower.includes('nest')) return 'leaf-outline'
    if (lower.includes('wet') || lower.includes('seep')) return 'water-outline'
    if (lower.includes('sharp')) return 'cut-outline'
    return 'alert-outline'
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, paddingTop: insets.top + 8 },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
          Route Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Route Title */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            {currentRoute.topoNumber && (
              <View style={[styles.topoNumberBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.topoNumberText}>{currentRoute.topoNumber}</Text>
              </View>
            )}
            <Text style={[styles.routeTitle, { color: colors.text }]} numberOfLines={2}>
              {currentRoute.name}
            </Text>
          </View>
          <View style={styles.titleMeta}>
            {currentRoute.grade && (
              <View style={[styles.gradeBadgeLarge, { backgroundColor: gradeColor + '20' }]}>
                <Text style={[styles.gradeTextLarge, { color: gradeColor }]}>
                  {currentRoute.grade}
                </Text>
              </View>
            )}
            {currentRoute.routeType && (
              <View style={[styles.typeBadge, { backgroundColor: colors.muted }]}>
                <Ionicons 
                  name={getRouteTypeIcon(currentRoute.routeType)} 
                  size={14} 
                  color={colors.textSecondary} 
                />
                <Text style={[styles.typeText, { color: colors.textSecondary }]}>
                  {currentRoute.routeType.charAt(0).toUpperCase() + currentRoute.routeType.slice(1)}
                </Text>
              </View>
            )}
            {currentRoute.rating && currentRoute.rating > 0 && (
              <View style={styles.ratingContainer}>
                {renderStars(currentRoute.rating)}
                {currentRoute.rating === 3 && (
                  <View style={[styles.classicBadge, { backgroundColor: '#F59E0B20' }]}>
                    <Text style={styles.classicText}>Classic</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Route Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statsGrid}>
            {/* Height */}
            {currentRoute.height && (
              <View style={styles.statItem}>
                <Ionicons name="resize-outline" size={20} color="#8B5CF6" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {currentRoute.height}m
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Height
                </Text>
              </View>
            )}

            {/* Pitches */}
            {currentRoute.pitches && currentRoute.pitches > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="layers-outline" size={20} color="#3B82F6" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {currentRoute.pitches}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Pitches
                </Text>
              </View>
            )}

            {/* Bolts */}
            {currentRoute.bolts && currentRoute.bolts > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="link-outline" size={20} color="#64748B" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {currentRoute.bolts}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Bolts
                </Text>
              </View>
            )}

            {/* Ascents */}
            {currentRoute.ascents && currentRoute.ascents > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {currentRoute.ascents}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Ascents
                </Text>
              </View>
            )}

            {/* Quality */}
            {currentRoute.quality && currentRoute.quality > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="diamond-outline" size={20} color="#EC4899" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {currentRoute.quality}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Quality
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* First Ascent */}
        {currentRoute.firstAscent && (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <Ionicons name="flag-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                First Ascent
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {currentRoute.firstAscent}
            </Text>
          </View>
        )}

        {/* Warnings */}
        {currentRoute.warnings.length > 0 && (
          <View style={[styles.warningsCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <View style={styles.warningsHeader}>
              <Ionicons name="warning" size={18} color="#DC2626" />
              <Text style={styles.warningsTitle}>Warnings</Text>
            </View>
            <View style={styles.warningsList}>
              {currentRoute.warnings.map((warning, index) => (
                <View key={index} style={styles.warningItem}>
                  <Ionicons name={getWarningIcon(warning)} size={14} color="#DC2626" />
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        {currentRoute.tags.length > 0 && (
          <View style={[styles.tagsCard, { backgroundColor: colors.card }]}>
            <View style={styles.tagsHeader}>
              <Ionicons name="pricetags-outline" size={18} color={colors.primary} />
              <Text style={[styles.tagsTitle, { color: colors.text }]}>Characteristics</Text>
            </View>
            <View style={styles.tagsList}>
              {currentRoute.tags.map((tag, index) => (
                <View key={index} style={[styles.tagBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Topo with route highlighted */}
        {topos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="image-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Topo
              </Text>
            </View>
            <View style={styles.topoContainer}>
              {topos.map((topo) => (
                <TopoViewer
                  key={topo.id}
                  topo={topo}
                  highlightedRouteId={routeId}
                  routeDetails={allRoutes}
                  showRouteList={false}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  // Title Section
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  topoNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topoNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  routeTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
  },
  titleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  gradeBadgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  gradeTextLarge: {
    fontSize: 18,
    fontWeight: '700',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  classicText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  // Stats Card
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  // Info Card
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Warnings Card
  warningsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  warningsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  warningsList: {
    gap: 8,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#991B1B',
    flex: 1,
  },
  // Tags Card
  tagsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tagsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Section
  section: {
    marginTop: 8,
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
  topoContainer: {
    gap: 16,
  },
})
