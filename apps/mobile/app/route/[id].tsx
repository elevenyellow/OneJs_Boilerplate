import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { TopoViewer } from '@/components/TopoViewer'
import { useSectorRoutes } from '@/hooks/useSectorRoutes'
import { useSectorTopos } from '@/hooks/useTopos'
import { gradeToIndex } from '@/utils/gradeConverter'
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
    gradeMin?: string
    gradeMax?: string
  }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const routeId = params.id
  const sectorId = params.sectorId

  // Fetch routes for this sector
  const { data: routesData, isLoading: isLoadingRoutes } = useSectorRoutes(
    sectorId || '',
    undefined,
    !!sectorId
  )

  // Fetch topos for this sector
  const { data: toposData, isLoading: isLoadingTopos } = useSectorTopos(
    sectorId || '',
    !!sectorId
  )

  const allRoutes = routesData?.routes || []
  const topos = toposData?.topos || []

  // Grade range for highlighting
  const userMinGradeIndex = params.gradeMin ? gradeToIndex(params.gradeMin) : null
  const userMaxGradeIndex = params.gradeMax ? gradeToIndex(params.gradeMax) : null

  const isLoading = isLoadingRoutes || isLoadingTopos

  // Render stars inline
  const renderStars = (stars: number | null) => {
    if (stars === null || stars === 0 || Number.isNaN(stars) || stars < 0) return null
    const fullStars = Math.max(0, Math.min(5, Math.floor(stars)))
    const hasHalf = stars - fullStars >= 0.5
    
    return (
      <View style={styles.starsRow}>
        {Array.from({ length: fullStars }, (_, i) => (
          <Ionicons key={i} name="star" size={12} color="#F59E0B" />
        ))}
        {hasHalf && <Ionicons name="star-half" size={12} color="#F59E0B" />}
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Back button floating */}
      <Pressable 
        onPress={() => router.back()} 
        hitSlop={8} 
        style={[styles.backButton, { backgroundColor: colors.background + 'E0' }]}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Topo with route highlighted - no title */}
        {topos.length > 0 && (
          <View style={styles.topoContainer}>
            {topos.map((topo) => (
              <TopoViewer
                key={topo.id}
                topo={topo}
                highlightedRouteId={routeId}
                gradeRange={userMinGradeIndex !== null && userMaxGradeIndex !== null 
                  ? { min: userMinGradeIndex, max: userMaxGradeIndex }
                  : undefined
                }
                routeDetails={allRoutes}
                showRouteList={false}
              />
            ))}
          </View>
        )}

        {/* Routes List with full info */}
        <View style={styles.routesSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Routes ({allRoutes.length})
            </Text>
          </View>
          
          {allRoutes.map((routeItem) => {
            const isSelected = routeItem.id === routeId
            const routeGradeColor = getGradeColor(routeItem.grade)
            
            return (
              <Pressable
                key={routeItem.id}
                onPress={() => {
                  if (routeItem.id !== routeId) {
                    router.replace({
                      pathname: '/route/[id]',
                      params: {
                        id: routeItem.id,
                        sectorId,
                        name: routeItem.name,
                        grade: routeItem.grade || '',
                        height: routeItem.height?.toString() || '',
                        stars: routeItem.stars?.toString() || '',
                        pitches: routeItem.pitches?.toString() || '',
                        bolts: routeItem.bolts?.toString() || '',
                        gradeMin: params.gradeMin || '',
                        gradeMax: params.gradeMax || '',
                      },
                    })
                  }
                }}
                style={[
                  styles.routeRow, 
                  { 
                    backgroundColor: isSelected ? colors.primary + '15' : colors.card, 
                    borderColor: isSelected ? colors.primary : colors.border,
                  }
                ]}
              >
                {/* Grade badge */}
                {routeItem.grade && (
                  <View style={[styles.gradeBadge, { backgroundColor: routeGradeColor + '20' }]}>
                    <Text style={[styles.gradeText, { color: routeGradeColor }]}>
                      {routeItem.grade}
                    </Text>
                  </View>
                )}

                {/* Route info */}
                <View style={styles.routeInfo}>
                  <Text 
                    style={[
                      styles.routeName, 
                      { color: isSelected ? colors.primary : colors.text }
                    ]} 
                    numberOfLines={1}
                  >
                    {routeItem.name}
                  </Text>
                  
                  {/* Meta info row */}
                  <View style={styles.routeMeta}>
                    {routeItem.height && (
                      <View style={styles.metaItem}>
                        <Ionicons name="arrow-up" size={12} color="#8B5CF6" />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {routeItem.height}m
                        </Text>
                      </View>
                    )}
                    {routeItem.pitches && routeItem.pitches > 1 && (
                      <View style={styles.metaItem}>
                        <Ionicons name="layers-outline" size={12} color="#3B82F6" />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {routeItem.pitches}L
                        </Text>
                      </View>
                    )}
                    {routeItem.bolts && routeItem.bolts > 0 && (
                      <View style={styles.metaItem}>
                        <Ionicons name="ellipse" size={10} color="#64748B" />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {routeItem.bolts}
                        </Text>
                      </View>
                    )}
                    {routeItem.stars !== null && routeItem.stars > 0 && (
                      <View style={styles.metaItem}>
                        {renderStars(routeItem.stars)}
                      </View>
                    )}
                  </View>
                </View>

                {/* Selected indicator */}
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </Pressable>
            )
          })}
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  topoContainer: {
    marginBottom: 16,
  },
  routesSection: {
    paddingHorizontal: 16,
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
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
})
