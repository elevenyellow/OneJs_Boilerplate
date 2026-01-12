import { FilterChip } from '@/components/FilterChip'
import { FilterChipsRow } from '@/components/FilterChipsRow'
import { HeroHeader } from '@/components/HeroHeader'
import { WeatherCard } from '@/components/WeatherCard'
import { Colors } from '@/constants/Colors'
import { useGradeRange } from '@/contexts/FiltersContext'
import { useCragDetail } from '@/hooks/useCragDetail'
import type { CragTopoImage, SearchSectorResult } from '@/lib/api'
import { countRoutesInGradeRange } from '@/utils/gradeConverter'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import Svg, { Ellipse, G, Path, Text as SvgText } from 'react-native-svg'

function getScoreColor(score: number): string {
  if (score >= 75) return '#10B981'
  if (score >= 50) return '#F59E0B'
  if (score >= 25) return '#EF4444'
  return '#64748B'
}

// SVG Helper functions
const SECTOR_COLOR = '#FFEA00' // Yellow
const SECTOR_HIGHLIGHT_COLOR = '#00FF7F' // Green

function parsePoints(pointsStr: string): Array<{ x: number; y: number }> {
  if (!pointsStr || typeof pointsStr !== 'string') return []
  const points: Array<{ x: number; y: number }> = []
  const segments = pointsStr.split(',')
  for (const segment of segments) {
    const trimmed = segment.trim()
    if (!trimmed) continue
    const parts = trimmed.split(/\s+/)
    if (parts.length >= 2) {
      const x = parseFloat(parts[0])
      const y = parseFloat(parts[1])
      if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
        points.push({ x, y })
      }
    }
  }
  return points
}

function pointsToPolygonPath(points: Array<{ x: number; y: number }>): string {
  if (!points || points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }
  path += ' Z'
  return path
}

// Get the bottom center of the polygon (for placing label below sector)
function getPolygonBottomCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 }
  
  // Find max Y (bottom) and calculate horizontal center
  let maxY = points[0].y
  let minX = points[0].x
  let maxX = points[0].x
  
  for (const point of points) {
    if (point.y > maxY) maxY = point.y
    if (point.x < minX) minX = point.x
    if (point.x > maxX) maxX = point.x
  }
  
  const centerX = (minX + maxX) / 2
  return { x: centerX, y: maxY }
}

const normalizeImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `https://www.thecrag.com${url}`
  return url
}

// Sector info for modal display
interface SectorDisplayInfo {
  id: string
  name: string
  routeCount: number
  avgStars: number | null
  kidFriendly: boolean | null
  beginner: boolean | null
  hasTopo: boolean
  orientation: string | null
}

// Panoramic Topo Component with zoom modal
interface PanoramicTopoProps {
  topo: CragTopoImage
  highlightedSectorId: string | null
  // Map of sector name (lowercase) to sector ID for fallback matching
  sectorNameToId: Map<string, string>
  // Map of sector ID to sector display info
  sectorInfoMap: Map<string, SectorDisplayInfo>
  // Callback to navigate to sector detail
  onSectorNavigate: (sectorId: string) => void
  // Callback to select/highlight a sector (for syncing with parent)
  onSectorSelect: (sectorId: string | null) => void
}

function PanoramicTopo({ topo, highlightedSectorId, sectorNameToId, sectorInfoMap, onSectorNavigate, onSectorSelect }: PanoramicTopoProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const [imageLoading, setImageLoading] = useState(true)
  const [zoomModalVisible, setZoomModalVisible] = useState(false)
  // Local state for selected sector in modal (independent from parent's highlightedSectorId)
  const [modalSelectedSectorId, setModalSelectedSectorId] = useState<string | null>(null)
  
  // When modal opens, initialize with the highlighted sector from parent
  const handleOpenModal = () => {
    setModalSelectedSectorId(highlightedSectorId)
    setZoomModalVisible(true)
  }

  // Handle sector click - if already selected, navigate; otherwise select
  const handleSectorClick = (effectiveSectorId: string | null, isModal: boolean) => {
    if (!effectiveSectorId) return
    
    if (isModal) {
      // In modal: check against modalSelectedSectorId
      if (modalSelectedSectorId === effectiveSectorId) {
        // Already selected - navigate to sector detail
        setZoomModalVisible(false)
        onSectorNavigate(effectiveSectorId)
      } else {
        // Select this sector
        setModalSelectedSectorId(effectiveSectorId)
      }
    } else {
      // In thumbnail/main page: check against highlightedSectorId
      if (highlightedSectorId === effectiveSectorId) {
        // Already selected - navigate to sector detail
        onSectorNavigate(effectiveSectorId)
      } else {
        // Select this sector
        onSectorSelect(effectiveSectorId)
      }
    }
  }

  const imageUrl = normalizeImageUrl(topo.fullImageUrl)
  const screenWidth = Dimensions.get('window').width
  const maxWidth = screenWidth - 32

  const originalWidth = topo.originalWidth > 0 ? topo.originalWidth : topo.width > 0 ? topo.width : 800
  const originalHeight = topo.originalHeight > 0 ? topo.originalHeight : topo.height > 0 ? topo.height : 600

  const aspectRatio = originalWidth / originalHeight
  const displayWidth = Math.min(maxWidth, originalWidth)
  const displayHeight = aspectRatio > 0 ? displayWidth / aspectRatio : displayWidth * 0.75

  const sectorPositions = Array.isArray(topo.sectorPositions) ? topo.sectorPositions : []

  // Zoom modal state
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 5)
    })
    .onEnd(() => {
      savedScale.value = scale.value
      if (scale.value < 1.1) {
        scale.value = withSpring(1)
        savedScale.value = 1
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
        savedTranslateX.value = 0
        savedTranslateY.value = 0
      }
    })

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        const zoomDisplayWidth = screenWidth
        const zoomDisplayHeight = zoomDisplayWidth / aspectRatio
        const maxTranslateX = (zoomDisplayWidth * (scale.value - 1)) / 2
        const maxTranslateY = (zoomDisplayHeight * (scale.value - 1)) / 2
        translateX.value = Math.min(Math.max(savedTranslateX.value + event.translationX, -maxTranslateX), maxTranslateX)
        translateY.value = Math.min(Math.max(savedTranslateY.value + event.translationY, -maxTranslateY), maxTranslateY)
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1)
        savedScale.value = 1
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
        savedTranslateX.value = 0
        savedTranslateY.value = 0
      } else {
        scale.value = withSpring(3)
        savedScale.value = 3
      }
    })

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  const zoomDisplayWidth = screenWidth
  const zoomDisplayHeight = zoomDisplayWidth / aspectRatio

  const renderSvgOverlay = (width: number, height: number, isZoom = false) => {
    // Use modalSelectedSectorId for modal, highlightedSectorId for thumbnail
    const activeHighlightId = isZoom ? modalSelectedSectorId : highlightedSectorId
    
    return (
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${originalWidth} ${originalHeight}`}
        style={StyleSheet.absoluteFill}
      >
        {sectorPositions.map((position, index) => {
          const points = parsePoints(position.points)
          if (points.length < 3) return null

          // Get effective sector ID - use sectorId if available, otherwise try to match by name
          const effectiveSectorId = position.sectorId || 
            sectorNameToId.get(position.areaName.toLowerCase()) || 
            null
          const isHighlighted = effectiveSectorId === activeHighlightId
          const pathData = pointsToPolygonPath(points)
          const bottomCenter = getPolygonBottomCenter(points)
          const lineColor = isHighlighted ? SECTOR_HIGHLIGHT_COLOR : SECTOR_COLOR
          const lineWidth = isHighlighted ? (isZoom ? 4 : 3) : (isZoom ? 2.5 : 2)
          // Label sizes for number badge below polygon
          const labelSize = isHighlighted ? (isZoom ? 22 : 16) : (isZoom ? 18 : 12)
          const fontSize = isHighlighted ? (isZoom ? 11 : 8) : (isZoom ? 9 : 7)
          // Position label below the polygon with offset
          const labelOffset = isZoom ? 14 : 10
          const labelY = bottomCenter.y + labelOffset

          return (
            <G key={position.externalAreaId || `sector-${index}`}>
              <Path d={pathData} stroke="#000" strokeWidth={lineWidth + 3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
              <Path d={pathData} stroke="#fff" strokeWidth={lineWidth + 1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d={pathData} stroke={lineColor} strokeWidth={lineWidth} fill={lineColor} fillOpacity={0.15} strokeLinecap="round" strokeLinejoin="round" />
              <G>
                <Ellipse cx={bottomCenter.x + 1} cy={labelY + 1} rx={labelSize / 2 + 2} ry={labelSize / 2 + 2} fill="#000" opacity={0.5} />
                <Ellipse cx={bottomCenter.x} cy={labelY} rx={labelSize / 2 + 2} ry={labelSize / 2 + 2} fill="#fff" />
                <Ellipse cx={bottomCenter.x} cy={labelY} rx={labelSize / 2} ry={labelSize / 2} fill={lineColor} />
                <SvgText x={bottomCenter.x} y={labelY + fontSize / 3} textAnchor="middle" fontSize={fontSize} fontWeight="bold" fill="#000">
                  {position.areaNumber}
                </SvgText>
              </G>
            </G>
          )
        })}
      </Svg>
    )
  }

  return (
    <View style={panoramicStyles.container}>
      <Pressable onPress={handleOpenModal}>
        <View style={[panoramicStyles.topoContainer, { width: displayWidth, height: displayHeight, borderColor: colors.border }]}>
          <Image
            source={{ uri: imageUrl }}
            style={[panoramicStyles.baseImage, { width: displayWidth, height: displayHeight }]}
            resizeMode="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          {imageLoading && (
            <View style={panoramicStyles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          {!imageLoading && originalWidth > 0 && originalHeight > 0 && renderSvgOverlay(displayWidth, displayHeight)}
          <View style={panoramicStyles.zoomIconOverlay}>
            <Ionicons name="expand-outline" size={20} color="#fff" />
          </View>
        </View>
      </Pressable>

      <Modal 
        visible={zoomModalVisible} 
        animationType="fade" 
        transparent={false} 
        statusBarTranslucent={true}
        presentationStyle="fullScreen"
        onRequestClose={() => setZoomModalVisible(false)}
      >
        <View style={panoramicStyles.zoomModalContainer}>
          {/* Header */}
          <View style={panoramicStyles.zoomHeader}>
            <Text style={panoramicStyles.zoomHintText}>Pinch to zoom • Double tap to enlarge</Text>
            <Pressable style={panoramicStyles.zoomCloseButton} onPress={() => setZoomModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>

          {/* Zoomable Image */}
          <GestureHandlerRootView style={panoramicStyles.zoomGestureContainer}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[panoramicStyles.zoomImageContainer, { width: zoomDisplayWidth, height: zoomDisplayHeight }, animatedStyle]}>
                <Image source={{ uri: imageUrl }} style={{ width: zoomDisplayWidth, height: zoomDisplayHeight }} resizeMode="contain" />
                {renderSvgOverlay(zoomDisplayWidth, zoomDisplayHeight, true)}
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
          
          {/* Sector list below image */}
          <View style={panoramicStyles.sectorListContainer}>
            <View style={panoramicStyles.sectorListHeader}>
              <Ionicons name="layers-outline" size={16} color="#fff" />
              <Text style={panoramicStyles.sectorListTitle}>Sectors</Text>
              <Text style={panoramicStyles.sectorListCount}>{sectorPositions.length}</Text>
            </View>
            <ScrollView 
              style={panoramicStyles.sectorListScroll}
              showsVerticalScrollIndicator={true}
            >
              {sectorPositions.map((position) => {
                const effectiveSectorId = position.sectorId || 
                  sectorNameToId.get(position.areaName.toLowerCase()) || 
                  null
                const isHighlighted = effectiveSectorId === modalSelectedSectorId
                const sectorInfo = effectiveSectorId ? sectorInfoMap.get(effectiveSectorId) : null
                return (
                  <Pressable 
                    key={position.externalAreaId || position.areaNumber} 
                    style={[
                      panoramicStyles.sectorListItem,
                      isHighlighted && panoramicStyles.sectorListItemHighlighted
                    ]}
                    onPress={() => handleSectorClick(effectiveSectorId, true)}
                  >
                    <View style={[
                      panoramicStyles.sectorListBadge,
                      { backgroundColor: isHighlighted ? SECTOR_HIGHLIGHT_COLOR : SECTOR_COLOR }
                    ]}>
                      <Text style={panoramicStyles.sectorListBadgeText}>{position.areaNumber}</Text>
                    </View>
                    <View style={panoramicStyles.sectorListContent}>
                      <Text style={[
                        panoramicStyles.sectorListName,
                        isHighlighted && panoramicStyles.sectorListNameHighlighted
                      ]} numberOfLines={1}>
                        {position.areaName}
                      </Text>
                      {sectorInfo && (
                        <View style={panoramicStyles.sectorListMeta}>
                          {/* Route count */}
                          <View style={panoramicStyles.sectorListMetaItem}>
                            <Ionicons name="git-branch-outline" size={10} color="rgba(255,255,255,0.5)" />
                            <Text style={panoramicStyles.sectorListMetaText}>{sectorInfo.routeCount}</Text>
                          </View>
                          {/* Stars */}
                          {sectorInfo.avgStars && sectorInfo.avgStars > 0 && (
                            <View style={panoramicStyles.sectorListMetaItem}>
                              <Ionicons name="star" size={10} color="#F59E0B" />
                              <Text style={[panoramicStyles.sectorListMetaText, { color: '#F59E0B' }]}>
                                {sectorInfo.avgStars.toFixed(1)}
                              </Text>
                            </View>
                          )}
                          {/* Beginner friendly */}
                          {sectorInfo.beginner === true && (
                            <View style={panoramicStyles.sectorListMetaItem}>
                              <Ionicons name="school-outline" size={10} color="#3B82F6" />
                            </View>
                          )}
                          {/* Kid friendly */}
                          {sectorInfo.kidFriendly === true && (
                            <View style={panoramicStyles.sectorListMetaItem}>
                              <Ionicons name="happy-outline" size={10} color="#8B5CF6" />
                            </View>
                          )}
                          {/* Has topo */}
                          {sectorInfo.hasTopo && (
                            <View style={panoramicStyles.sectorListMetaItem}>
                              <Ionicons name="map-outline" size={10} color="#10B981" />
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    <Ionicons 
                      name={isHighlighted ? "arrow-forward-circle" : "chevron-forward"}
                      size={isHighlighted ? 20 : 16} 
                      color={isHighlighted ? SECTOR_HIGHLIGHT_COLOR : 'rgba(255,255,255,0.4)'} 
                    />
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const panoramicStyles = StyleSheet.create({
  container: { width: '100%', marginBottom: 12 },
  topoContainer: { alignSelf: 'center', borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a2e', position: 'relative', borderWidth: 1 },
  baseImage: { position: 'absolute', top: 0, left: 0 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(26, 26, 46, 0.8)' },
  zoomIconOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 6 },
  // Modal styles - full screen
  zoomModalContainer: { flex: 1, backgroundColor: '#0f0f1a', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  zoomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  zoomHintText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  zoomCloseButton: { padding: 8 },
  zoomGestureContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  zoomImageContainer: { position: 'relative' },
  // Sector list styles
  sectorListContainer: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: 250, paddingBottom: 20 },
  sectorListHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  sectorListTitle: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  sectorListCount: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  sectorListScroll: { paddingHorizontal: 12 },
  sectorListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginVertical: 2 },
  sectorListItemHighlighted: { backgroundColor: 'rgba(0, 255, 127, 0.15)' },
  sectorListBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectorListBadgeText: { color: '#000', fontSize: 12, fontWeight: '700' },
  sectorListContent: { flex: 1 },
  sectorListName: { fontSize: 14, fontWeight: '500', color: '#fff' },
  sectorListNameHighlighted: { color: SECTOR_HIGHLIGHT_COLOR },
  sectorListMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  sectorListMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectorListMetaText: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
})

// Sun preference type
type SunPreference = 'any' | 'sun' | 'shade'

export default function CragDetailScreen() {
  const {
    id,
    sectorsData,
    avgScore,
    distance: distanceParam,
    appliedSunPreference,
    appliedMinRoutes,
    appliedWithTopo,
  } = useLocalSearchParams<{
    id: string
    sectorsData?: string
    avgScore?: string
    distance?: string
    appliedSunPreference?: string
    appliedMinRoutes?: string
    appliedWithTopo?: string
  }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  // Get global grade range (shared with Explorer and Filter screens)
  const { gradeRange: globalGradeRange } = useGradeRange()

  // Parse pre-scored sectors from navigation params (already scored by backend)
  const scoredSectors: SearchSectorResult[] = useMemo(() => {
    if (!sectorsData) return []
    try {
      return JSON.parse(sectorsData)
    } catch {
      return []
    }
  }, [sectorsData])

  const {
    data: crag,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useCragDetail(id || '')

  // Filter state (grade range comes from global context, not local state)
  const [sunPreference, setSunPreference] = useState<SunPreference>('any')
  const [minRoutes, setMinRoutes] = useState(0)
  const [withTopo, setWithTopo] = useState(false)

  // Sort state
  type SortOption = 'score' | 'number' | 'name' | 'stars' | 'routes' | 'grade'
  const [sortBy, setSortBy] = useState<SortOption>('score')
  const [sortAscending, setSortAscending] = useState(false)

  // Highlighted sector state (for panoramic topo interaction)
  const [highlightedSectorId, setHighlightedSectorId] = useState<string | null>(null)

  // Update filters when returning from filter screen
  useEffect(() => {
    if (appliedSunPreference) {
      setSunPreference(appliedSunPreference as SunPreference)
    }
    if (appliedMinRoutes) {
      setMinRoutes(parseInt(appliedMinRoutes, 10) || 0)
    }
    if (appliedWithTopo !== undefined) {
      setWithTopo(appliedWithTopo === 'true')
    }
  }, [
    appliedSunPreference,
    appliedMinRoutes,
    appliedWithTopo,
  ])

  // Combine scored sectors with crag sectors to show all
  // scoredSectors come from search navigation, crag.sectors come from API
  const allSectors = useMemo((): SearchSectorResult[] => {
    // Helper to convert SectorSummary to SearchSectorResult
    // Calculates routesInUserRange locally using gradeDistribution
    const convertToSearchResult = (s: {
      id: string
      name: string
      orientation: string | null
      rockType: string | null
      sunExposure: string | null
      routeCount?: number
      minGrade?: string | null
      maxGrade?: string | null
      avgGrade?: string | null
      avgHeight?: number | null
      maxHeight?: number | null
      hasTopo?: boolean
      headerImageUrl?: string | null
      gradeDistribution?: Record<string, number>
      avgStars?: number | null
      // Tags
      kidFriendly?: boolean | null
      beginner?: boolean | null
      dogFriendly?: boolean | null
      accessible?: boolean | null
      camping?: boolean | null
      swimming?: boolean | null
      scenic?: boolean | null
      popular?: boolean | null
      quiet?: boolean | null
    }): SearchSectorResult => {
      // Calculate routes in range locally using gradeDistribution
      const routesInRange = countRoutesInGradeRange(
        s.gradeDistribution || {},
        globalGradeRange.min,
        globalGradeRange.max
      )
      
      return {
        sector: {
          id: s.id,
          name: s.name,
          orientation: s.orientation,
          rockType: s.rockType,
          sunExposure: s.sunExposure,
          routeCount: s.routeCount || 0,
          minGrade: s.minGrade || null,
          maxGrade: s.maxGrade || null,
          avgGrade: s.avgGrade || null,
          avgHeight: s.avgHeight || null,
          maxHeight: s.maxHeight || null,
          hasTopo: s.hasTopo || false,
          routes: [],
          coordinates: null,
          avgStars: s.avgStars || null,
          climbingStyle: null,
          headerImageUrl: s.headerImageUrl || null,
          gradeDistribution: s.gradeDistribution || {},
          // Tags
          kidFriendly: s.kidFriendly || null,
          beginner: s.beginner || null,
          dogFriendly: s.dogFriendly || null,
          accessible: s.accessible || null,
          camping: s.camping || null,
          swimming: s.swimming || null,
          scenic: s.scenic || null,
          popular: s.popular || null,
          quiet: s.quiet || null,
        },
        relevanceScore: 0, // Calculated client-side in filteredAndSortedSectors
        distance: 0,
        routesInUserRange: routesInRange,
        matchReasons: [],
        scoringBreakdown: {
          gradeMatch: 0,
          distance: 0,
          orientation: 0,
          popularity: 0,
          routeCount: 0,
          quality: 0,
        },
        conditions: undefined,
      }
    }

    // If we have scored sectors from search, use them as base
    // but enrich them with data from crag.sectors
    if (scoredSectors.length > 0) {
      const cragSectorsMap = new Map(
        (crag?.sectors || []).map((s) => [s.id, s]),
      )

      // Enrich scored sectors with crag sector data
      // Calculate routesInUserRange locally using gradeDistribution
      const enrichedScoredSectors = scoredSectors.map((sr) => {
        const cragSector = cragSectorsMap.get(sr.sector.id)
        if (cragSector) {
          // Calculate routes in range locally using gradeDistribution
          const gradeDistribution = cragSector.gradeDistribution || sr.sector.gradeDistribution || {}
          const routesInRange = countRoutesInGradeRange(
            gradeDistribution,
            globalGradeRange.min,
            globalGradeRange.max
          )
          
          return {
            ...sr,
            sector: {
              ...sr.sector,
              routeCount: cragSector.routeCount || sr.sector.routeCount || 0,
              minGrade: cragSector.minGrade || sr.sector.minGrade,
              maxGrade: cragSector.maxGrade || sr.sector.maxGrade,
              avgGrade: cragSector.avgGrade || sr.sector.avgGrade,
              avgHeight: cragSector.avgHeight || sr.sector.avgHeight,
              maxHeight: cragSector.maxHeight || sr.sector.maxHeight,
              hasTopo: cragSector.hasTopo || sr.sector.hasTopo,
              avgStars: cragSector.avgStars || sr.sector.avgStars,
              headerImageUrl: cragSector.headerImageUrl || sr.sector.headerImageUrl,
              gradeDistribution,
              // Tags
              kidFriendly: cragSector.kidFriendly ?? sr.sector.kidFriendly ?? null,
              beginner: cragSector.beginner ?? sr.sector.beginner ?? null,
            },
            routesInUserRange: routesInRange,
          }
        }
        return sr
      })

      const scoredIds = new Set(scoredSectors.map((s) => s.sector.id))

      // Add any crag sectors that aren't in scoredSectors
      const additionalSectors = (crag?.sectors || [])
        .filter((s) => !scoredIds.has(s.id))
        .map(convertToSearchResult)

      return [...enrichedScoredSectors, ...additionalSectors].sort(
        (a, b) => b.relevanceScore - a.relevanceScore,
      )
    }

    // If no scored sectors, convert crag.sectors to SearchSectorResult format
    return (crag?.sectors || [])
      .map(convertToSearchResult)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }, [scoredSectors, crag?.sectors, globalGradeRange])

  // Create a map of sector names (lowercase) to their IDs for topo matching
  const sectorNameToId = useMemo(() => {
    const map = new Map<string, string>()
    for (const sr of allSectors) {
      map.set(sr.sector.name.toLowerCase(), sr.sector.id)
    }
    return map
  }, [allSectors])

  // Create a map of sector ID to its areaNumber from the topo positions
  const sectorIdToAreaNumber = useMemo(() => {
    const map = new Map<string, string>()
    const topoPositions = crag?.topoImages?.[0]?.sectorPositions || []
    for (const pos of topoPositions) {
      // Try to match by sectorId first, then by name
      const sectorId = pos.sectorId || sectorNameToId.get(pos.areaName.toLowerCase())
      if (sectorId) {
        map.set(sectorId, pos.areaNumber)
      }
    }
    return map
  }, [crag?.topoImages, sectorNameToId])

  // Build sector info map for modal display
  const sectorInfoMap = useMemo(() => {
    const map = new Map<string, SectorDisplayInfo>()
    for (const sectorResult of allSectors) {
      const sector = sectorResult.sector
      map.set(sector.id, {
        id: sector.id,
        name: sector.name,
        routeCount: sector.routeCount || 0,
        avgStars: sector.avgStars || null,
        kidFriendly: sector.kidFriendly ?? null,
        beginner: sector.beginner ?? null,
        hasTopo: sector.hasTopo || false,
        orientation: sector.orientation || null,
      })
    }
    return map
  }, [allSectors])

  // Get rock type from first sector if available
  const primaryRockType = allSectors[0]?.sector?.rockType || null

  // Helper to check if sector is in sun or shade based on orientation and time
  const isSectorInSun = (orientation: string | null): boolean => {
    if (!orientation) return true // Unknown = treat as sun
    const hour = new Date().getHours()
    // Simplified sun logic:
    // Morning (6-12): E, SE, S facing walls get sun
    // Afternoon (12-18): S, SW, W facing walls get sun
    // Evening (18-20): W, NW facing walls get sun
    const sunnyOrientations: Record<string, string[]> = {
      morning: ['E', 'SE', 'S', 'NE'],
      afternoon: ['S', 'SW', 'W', 'SE'],
      evening: ['W', 'NW', 'SW'],
    }
    let period = 'morning'
    if (hour >= 12 && hour < 18) period = 'afternoon'
    else if (hour >= 18) period = 'evening'

    return sunnyOrientations[period].includes(orientation)
  }

  /**
   * Calculate comprehensive score for each sector based on:
   * 1. Weather conditions (meteo) - 25% weight
   * 2. Routes in user's grade range - 35% weight  
   * 3. Applied filters match (orientation, topo) - 20% weight
   * 4. Route quality (avg stars) - 20% weight
   */
  const filteredAndSortedSectors = useMemo(() => {
    // Calculate comprehensive score for each sector
    const sectorsWithScore = allSectors.map((sectorResult) => {
      const sector = sectorResult.sector
      const routesInRange = sectorResult.routesInUserRange || 0
      const totalRoutes = sector.routeCount || sector.routes?.length || 1
      
      // 1. WEATHER SCORE (0-100) - 25% weight
      // Use conditions.weatherScore if available, otherwise estimate from isGoodDay
      let weatherScore = 50 // Default neutral
      if (sectorResult.conditions) {
        weatherScore = sectorResult.conditions.weatherScore || 
                       (sectorResult.conditions.isGoodDay ? 80 : 40)
      }
      
      // 2. ROUTES IN RANGE SCORE (0-100) - 35% weight
      // Normalize: more routes in range = higher score
      // Use logarithmic scale to avoid extreme values
      const routesScore = routesInRange > 0 
        ? Math.min(100, Math.log10(routesInRange + 1) * 50 + (routesInRange / totalRoutes) * 50)
        : 0
      
      // 3. FILTERS MATCH SCORE (0-100) - 20% weight
      let filtersScore = 50 // Base score
      
      // Orientation match bonus
      if (sunPreference !== 'any') {
        const inSun = isSectorInSun(sector.orientation)
        const matchesPreference = 
          (sunPreference === 'sun' && inSun) || 
          (sunPreference === 'shade' && !inSun)
        filtersScore += matchesPreference ? 30 : -20
      }
      
      // Topo availability bonus
      if (withTopo && (sector.hasTopo || sector.headerImageUrl)) {
        filtersScore += 20
      } else if (!withTopo && (sector.hasTopo || sector.headerImageUrl)) {
        filtersScore += 10 // Small bonus even if not required
      }
      
      // Clamp to 0-100
      filtersScore = Math.max(0, Math.min(100, filtersScore))
      
      // 4. QUALITY SCORE (0-100) - 20% weight
      // Based on average stars (0-5 scale)
      const avgStars = sector.avgStars || 0
      const qualityScore = avgStars > 0 ? (avgStars / 5) * 100 : 50 // Default to neutral if no ratings
      
      // COMBINED WEIGHTED SCORE
      const calculatedScore = 
        (weatherScore * 0.25) +
        (routesScore * 0.35) +
        (filtersScore * 0.20) +
        (qualityScore * 0.20)
      
      return {
        ...sectorResult,
        calculatedScore,
        scoreBreakdown: {
          weather: weatherScore,
          routes: routesScore,
          filters: filtersScore,
          quality: qualityScore,
        },
      }
    })

    // Apply hard filters (these exclude sectors entirely)
    const filtered = sectorsWithScore.filter((sectorResult) => {
      const sector = sectorResult.sector

      // Filter by sun preference (hard filter)
      if (sunPreference !== 'any') {
        const inSun = isSectorInSun(sector.orientation)
        if (sunPreference === 'sun' && !inSun) return false
        if (sunPreference === 'shade' && inSun) return false
      }

      // Filter by minimum routes in range (hard filter)
      if (minRoutes > 0 && sectorResult.routesInUserRange < minRoutes) {
        return false
      }

      // Filter by with topo (hard filter)
      if (withTopo) {
        if (!sector.hasTopo && !sector.headerImageUrl) {
          return false
        }
      }

      return true
    })

    // Sort based on selected option
    return filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'score':
          comparison = b.calculatedScore - a.calculatedScore
          break
        case 'number': {
          // Sort by area number from topo (if available)
          const aNum = sectorIdToAreaNumber.get(a.sector.id)
          const bNum = sectorIdToAreaNumber.get(b.sector.id)
          const aNumInt = aNum ? parseInt(aNum, 10) : 999
          const bNumInt = bNum ? parseInt(bNum, 10) : 999
          comparison = aNumInt - bNumInt
          break
        }
        case 'name':
          comparison = a.sector.name.localeCompare(b.sector.name)
          break
        case 'stars':
          comparison = (b.sector.avgStars || 0) - (a.sector.avgStars || 0)
          break
        case 'routes':
          comparison = (b.routesInUserRange || 0) - (a.routesInUserRange || 0)
          break
        case 'grade': {
          // Sort by minimum grade index
          const aGrade = a.sector.minGrade || 'z'
          const bGrade = b.sector.minGrade || 'z'
          comparison = aGrade.localeCompare(bGrade)
          break
        }
        default:
          comparison = b.calculatedScore - a.calculatedScore
      }
      
      // Apply ascending/descending
      return sortAscending ? -comparison : comparison
    })
  }, [
    allSectors,
    sunPreference,
    minRoutes,
    withTopo,
    sortBy,
    sortAscending,
    sectorIdToAreaNumber,
  ])

  // Alias for backwards compatibility with template
  const filteredSectors = filteredAndSortedSectors

  // Calculate total routes in range across all sectors (client-side)
  const totalRoutesInRange = useMemo(() => {
    return allSectors.reduce((sum, sr) => sum + (sr.routesInUserRange || 0), 0)
  }, [allSectors])

  // Count active filters (grade range always counts since it's used for scoring)
  const activeFiltersCount = useMemo(() => {
    let count = 1 // Grade range is always active (used for scoring)
    if (sunPreference !== 'any') count++
    if (minRoutes > 0) count++
    if (withTopo) count++
    return count
  }, [sunPreference, minRoutes, withTopo])

  // Clear all filters (except grade range which is global)
  const clearFilters = () => {
    setSunPreference('any')
    setMinRoutes(0)
    setWithTopo(false)
  }

  const handleGetDirections = () => {
    if (crag?.latitude && crag?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${crag.latitude},${crag.longitude}`
      Linking.openURL(url)
    }
  }

  const handleSectorPress = (sectorResult: SearchSectorResult) => {
    const sector = sectorResult.sector
    const grades =
      sector.routes
        ?.map((r: { grade: string | null }) => r.grade)
        .filter(Boolean)
        .sort() || []
    const gradeMin = grades[0] || ''
    const gradeMax = grades[grades.length - 1] || ''

    const params = new URLSearchParams({
      name: sector.name || '',
      cragName: crag?.name || '',
      orientation: sector.orientation || '',
      sunExposure: sector.sunExposure || '',
      rockType: sector.rockType || '',
      avgStars: sector.avgStars?.toString() || '',
      totalRoutes: (sector.routes?.length || 0).toString(),
      routesInRange: sectorResult.routesInUserRange.toString(),
      gradeMin,
      gradeMax,
      distance: distanceParam || '',
      climbingStyle: Array.isArray(sector.climbingStyle)
        ? sector.climbingStyle.join(', ')
        : sector.climbingStyle || '',
    })

    // Add coordinates if available
    if (sector.coordinates?.lat) {
      params.set('latitude', sector.coordinates.lat.toString())
    }
    if (sector.coordinates?.lon) {
      params.set('longitude', sector.coordinates.lon.toString())
    }

    // Add header image if available (sector image, or fallback to crag image)
    if (sector.headerImageUrl) {
      params.set('headerImageUrl', sector.headerImageUrl)
    } else if (crag?.headerImageUrl) {
      // Fallback to crag header image if sector doesn't have one
      params.set('headerImageUrl', crag.headerImageUrl)
    }

    // Add tags
    if (sector.kidFriendly !== null && sector.kidFriendly !== undefined) {
      params.set('kidFriendly', sector.kidFriendly.toString())
    }
    if (sector.beginner !== null && sector.beginner !== undefined) {
      params.set('beginner', sector.beginner.toString())
    }
    if (sector.dogFriendly !== null && sector.dogFriendly !== undefined) {
      params.set('dogFriendly', sector.dogFriendly.toString())
    }
    if (sector.accessible !== null && sector.accessible !== undefined) {
      params.set('accessible', sector.accessible.toString())
    }
    if (sector.camping !== null && sector.camping !== undefined) {
      params.set('camping', sector.camping.toString())
    }
    if (sector.swimming !== null && sector.swimming !== undefined) {
      params.set('swimming', sector.swimming.toString())
    }
    if (sector.scenic !== null && sector.scenic !== undefined) {
      params.set('scenic', sector.scenic.toString())
    }
    if (sector.popular !== null && sector.popular !== undefined) {
      params.set('popular', sector.popular.toString())
    }
    if (sector.quiet !== null && sector.quiet !== undefined) {
      params.set('quiet', sector.quiet.toString())
    }

    router.push(`/sector/${sector.id}?${params.toString()}`)
  }

  // Navigate to sector by ID (used by PanoramicTopo component)
  const handleSectorNavigateById = (sectorId: string) => {
    const sectorResult = allSectors.find(s => s.sector.id === sectorId)
    if (sectorResult) {
      handleSectorPress(sectorResult)
    } else {
      // Fallback: simple navigation without params
      router.push(`/sector/${sectorId}`)
    }
  }

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading zone...
        </Text>
      </View>
    )
  }

  if (isError || !crag) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons name="alert-circle" size={64} color={colors.destructive} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Error loading zone
        </Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
          Could not get information
        </Text>
        <Pressable
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text
            style={[
              styles.retryButtonText,
              { color: colors.primaryForeground },
            ]}
          >
            Retry
          </Text>
        </Pressable>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={[styles.backLinkText, { color: colors.primary }]}>
            Go back
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    >
      {/* Hero Header with Image */}
      <HeroHeader
        title={crag.name}
        subtitle={
          crag.region ? `${crag.region}, ${crag.country}` : crag.country
        }
        imageUrl={crag.headerImageUrl}
        theCragUrl={crag.theCragUrl}
        rockType={primaryRockType}
        icon="layers"
        onBack={() => router.back()}
        stats={[
          { label: 'sectors', value: crag.totalSectors, icon: 'grid' },
          { label: 'routes', value: crag.totalRoutes, icon: 'git-branch' },
          ...(totalRoutesInRange > 0 &&
          totalRoutesInRange !== crag.totalRoutes
            ? [
                {
                  label: 'in range',
                  value: totalRoutesInRange,
                  icon: 'checkmark-circle' as const,
                },
              ]
            : []),
          ...(distanceParam
            ? [
                {
                  label: 'km',
                  value:
                    Number(distanceParam) < 1
                      ? `${Math.round(Number(distanceParam) * 1000)}m`
                      : Number(distanceParam).toFixed(1),
                  icon: 'location' as const,
                },
              ]
            : []),
        ]}
        badge={
          avgScore
            ? {
                label: `${Math.round(Number(avgScore))} match`,
                color: getScoreColor(Number(avgScore)),
              }
            : undefined
        }
      />

      <View style={styles.content}>
        {/* Weather Card - Full Width */}
        {crag.latitude && crag.longitude && (
          <WeatherCard
            latitude={crag.latitude}
            longitude={crag.longitude}
            onPress={() => router.push(`/crag/weather/${id}`)}
            showChevron
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Action Buttons Row - Full Width */}
        <View style={styles.actionButtonsRow}>
          {/* Directions Button */}
          {crag.latitude && crag.longitude && (
            <Pressable
              onPress={handleGetDirections}
              style={[
                styles.actionButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="navigate" size={22} color="#10B981" />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Directions
              </Text>
            </Pressable>
          )}

          {/* Info Button */}
          {(crag.description || crag.approach) && (
            <Pressable
              onPress={() => router.push(`/crag/info/${id}`)}
              style={[
                styles.actionButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="information-circle" size={22} color="#3B82F6" />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Info
              </Text>
            </Pressable>
          )}

          {/* Filters Button */}
          <Pressable
            onPress={() => {
              const params = new URLSearchParams()
              // Grade range comes from global context, no need to pass it
              if (sunPreference !== 'any') {
                params.set('sunPreference', sunPreference)
              }
              if (minRoutes > 0) {
                params.set('minRoutes', minRoutes.toString())
              }
              if (withTopo) {
                params.set('withTopo', 'true')
              }
              router.push(`/crag/filters/${id}?${params.toString()}`)
            }}
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="options" size={22} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Filters
            </Text>
            {activeFiltersCount > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Active Filters Chips - Always shown with default values */}
        <FilterChipsRow>
          <FilterChip
            label={`${globalGradeRange.min} - ${globalGradeRange.max}`}
            icon="trending-up-outline"
            isActive
            onPress={() => router.push(`/crag/filters/${id}`)}
          />

          <FilterChip
            label={sunPreference === 'sun' ? 'Sun' : sunPreference === 'shade' ? 'Shade' : 'Sun/Shade'}
            icon={sunPreference === 'sun' ? 'sunny' : sunPreference === 'shade' ? 'moon' : 'contrast-outline'}
            isActive={sunPreference !== 'any'}
            onPress={() => {
              const nextValue = sunPreference === 'any' ? 'sun' : sunPreference === 'sun' ? 'shade' : 'any'
              setSunPreference(nextValue)
            }}
          />

          <FilterChip
            label={minRoutes > 0 ? `${minRoutes}+ routes` : 'Any routes'}
            icon="git-branch-outline"
            isActive={minRoutes > 0}
            onPress={() => {
              const options = [0, 5, 10, 20]
              const currentIndex = options.indexOf(minRoutes)
              const nextIndex = (currentIndex + 1) % options.length
              setMinRoutes(options[nextIndex])
            }}
          />

          <FilterChip
            label={withTopo ? 'With Topo' : 'Topo'}
            icon="map-outline"
            isActive={withTopo}
            onPress={() => setWithTopo(!withTopo)}
          />
        </FilterChipsRow>

        {/* Legend */}
        <View style={[styles.legendContainer, { backgroundColor: colors.muted }]}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <Ionicons name="sparkles" size={12} color="#10B981" />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>ideal</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>in range</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="git-branch-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>routes</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="sunny-outline" size={12} color="#F59E0B" />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>sun</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="moon-outline" size={12} color="#6366F1" />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>shade</Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>quality</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="happy-outline" size={12} color="#8B5CF6" />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>kids</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="school-outline" size={12} color="#3B82F6" />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>beginner</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="map-outline" size={12} color="#10B981" />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>topo</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="resize-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>height</Text>
            </View>
          </View>
        </View>

        {/* Sectors Section */}
        <View style={styles.sectorsContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="layers-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Sectors
              </Text>
            </View>
            <Text style={[styles.sectorCount, { color: colors.textSecondary }]}>
              {filteredSectors.length}
              {filteredSectors.length !== allSectors.length ? ` of ${allSectors.length}` : ''}
            </Text>
          </View>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortScrollContent}
            >
              {([
                { key: 'score', label: 'Score', icon: 'analytics-outline' },
                { key: 'number', label: 'Number', icon: 'list-outline' },
                { key: 'name', label: 'Name', icon: 'text-outline' },
                { key: 'stars', label: 'Stars', icon: 'star-outline' },
                { key: 'routes', label: 'Routes', icon: 'git-branch-outline' },
                { key: 'grade', label: 'Grade', icon: 'trending-up-outline' },
              ] as { key: SortOption; label: string; icon: string }[]).map((option) => {
                const isActive = sortBy === option.key
                return (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.sortChip,
                      { 
                        backgroundColor: isActive ? colors.primary + '20' : colors.muted,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (sortBy === option.key) {
                        // Toggle ascending/descending
                        setSortAscending(!sortAscending)
                      } else {
                        setSortBy(option.key)
                        setSortAscending(false)
                      }
                    }}
                  >
                    <Ionicons 
                      name={option.icon as keyof typeof Ionicons.glyphMap} 
                      size={14} 
                      color={isActive ? colors.primary : colors.textSecondary} 
                    />
                    <Text 
                      style={[
                        styles.sortChipText, 
                        { color: isActive ? colors.primary : colors.textSecondary }
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isActive && (
                      <Ionicons 
                        name={sortAscending ? 'arrow-up' : 'arrow-down'} 
                        size={12} 
                        color={colors.primary} 
                      />
                    )}
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          {/* Panoramic Topo Image */}
          {crag.topoImages && crag.topoImages.length > 0 && crag.topoImages[0].sectorPositions?.length > 0 && (
            <PanoramicTopo
              topo={crag.topoImages[0]}
              highlightedSectorId={highlightedSectorId}
              sectorNameToId={sectorNameToId}
              sectorInfoMap={sectorInfoMap}
              onSectorNavigate={handleSectorNavigateById}
              onSectorSelect={setHighlightedSectorId}
            />
          )}

          {/* Sectors List */}
          {filteredSectors.length > 0 ? (
            <View style={styles.sectorsList}>
              {filteredSectors.map((sectorResult, index) => {
                const sector = sectorResult.sector
                const totalRoutes = sector.routeCount || sector.routes?.length || 0
                const routesInRange = sectorResult.routesInUserRange
                const hasRoutesInRange = routesInRange > 0
                const hasGoodScore = sectorResult.calculatedScore >= 65
                const hasGoodWeather = sectorResult.conditions?.isGoodDay || 
                                       (sectorResult.conditions?.weatherScore ?? 50) >= 60
                const isIdeal = hasRoutesInRange && hasGoodScore && hasGoodWeather
                const hasTopo = sector.hasTopo || sector.headerImageUrl
                const orientation = sector.orientation
                const avgHeight = sector.avgHeight
                const maxHeight = sector.maxHeight
                const avgStars = sector.avgStars
                const inSun = isSectorInSun(orientation)
                const isHighlighted = sector.id === highlightedSectorId
                const isKidFriendly = sector.kidFriendly === true
                const isBeginner = sector.beginner === true

                return (
                  <Pressable
                    key={sector.id}
                    style={[
                      styles.sectorRow,
                      {
                        backgroundColor: isHighlighted ? colors.primary + '15' : colors.card,
                        borderColor: isHighlighted ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      // If already selected, navigate to detail; otherwise select
                      if (highlightedSectorId === sector.id) {
                        handleSectorPress(sectorResult)
                      } else {
                        setHighlightedSectorId(sector.id)
                      }
                    }}
                  >
                    {/* Number badge - use areaNumber from topo if available */}
                    <View
                      style={[
                        styles.sectorNumBadge,
                        { backgroundColor: isHighlighted ? colors.primary : colors.muted },
                      ]}
                    >
                      <Text style={[styles.sectorNumText, { color: isHighlighted ? '#FFF' : colors.text }]}>
                        {sectorIdToAreaNumber.get(sector.id) || (index + 1)}
                      </Text>
                    </View>

                    {/* Sector info */}
                    <View style={styles.sectorInfo}>
                      <View style={styles.sectorNameRow}>
                        {isIdeal && (
                          <Ionicons
                            name="sparkles"
                            size={14}
                            color="#10B981"
                            style={{ marginRight: 4 }}
                          />
                        )}
                        {hasRoutesInRange && !isIdeal && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#22C55E"
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          style={[styles.sectorNameText, { color: colors.text, fontWeight: isHighlighted ? '700' : '600' }]}
                          numberOfLines={1}
                        >
                          {sector.name}
                        </Text>
                      </View>
                      <View style={styles.sectorMeta}>
                        {/* Routes total / in range */}
                        <View style={styles.sectorMetaItem}>
                          <Ionicons
                            name="git-branch-outline"
                            size={11}
                            color={colors.textSecondary}
                          />
                          <Text style={[styles.sectorMetaText, { color: colors.textSecondary }]}>
                            {routesInRange > 0 ? `${routesInRange}/${totalRoutes}` : totalRoutes}
                          </Text>
                        </View>
                        {/* Sun/Shade indicator - always show based on orientation */}
                        <View style={styles.sectorMetaItem}>
                          <Ionicons
                            name={inSun ? 'sunny-outline' : 'moon-outline'}
                            size={11}
                            color={inSun ? '#F59E0B' : '#6366F1'}
                          />
                          {orientation && (
                            <Text style={[styles.sectorMetaText, { color: colors.textSecondary }]}>
                              {orientation}
                            </Text>
                          )}
                        </View>
                        {/* Stars - quality indicator */}
                        {avgStars && avgStars > 0 && (
                          <View style={styles.sectorMetaItem}>
                            <Ionicons name="star" size={11} color="#F59E0B" />
                            <Text style={[styles.sectorMetaText, { color: '#F59E0B' }]}>
                              {avgStars.toFixed(1)}
                            </Text>
                          </View>
                        )}
                        {/* Height */}
                        {(avgHeight || maxHeight) && (
                          <View style={styles.sectorMetaItem}>
                            <Ionicons name="resize-outline" size={11} color={colors.textSecondary} />
                            <Text style={[styles.sectorMetaText, { color: colors.textSecondary }]}>
                              {maxHeight ? `${Math.round(maxHeight)}m` : `${Math.round(avgHeight!)}m`}
                            </Text>
                          </View>
                        )}
                        {/* Topo indicator */}
                        {hasTopo && (
                          <View style={styles.sectorMetaItem}>
                            <Ionicons name="map-outline" size={11} color="#10B981" />
                          </View>
                        )}
                        {/* Beginner friendly */}
                        {isBeginner && (
                          <View style={styles.sectorMetaItem}>
                            <Ionicons name="school-outline" size={11} color="#3B82F6" />
                          </View>
                        )}
                        {/* Kid friendly */}
                        {isKidFriendly && (
                          <View style={styles.sectorMetaItem}>
                            <Ionicons name="happy-outline" size={11} color="#8B5CF6" />
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Grade badge */}
                    <View
                      style={[
                        styles.gradeBadge,
                        { backgroundColor: '#F59E0B20' },
                      ]}
                    >
                      <Text style={[styles.gradeText, { color: '#F59E0B' }]}>
                        {sector.minGrade || '?'}-{sector.maxGrade || '?'}
                      </Text>
                    </View>

                    {/* Score badge */}
                    {sectorResult.calculatedScore > 0 && (
                      <View
                        style={[
                          styles.scoreBadge,
                          { backgroundColor: getScoreColor(sectorResult.calculatedScore) },
                        ]}
                      >
                        <Text style={styles.scoreText}>
                          {Math.round(sectorResult.calculatedScore)}
                        </Text>
                      </View>
                    )}

                    {/* Navigate button */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation()
                        handleSectorPress(sectorResult)
                      }}
                      hitSlop={8}
                      style={[
                        styles.navigateButton,
                        { backgroundColor: colors.muted },
                      ]}
                    >
                      <Ionicons
                        name="arrow-forward-circle-outline"
                        size={22}
                        color={colors.primary}
                      />
                    </Pressable>
                  </Pressable>
                )
              })}
            </View>
          ) : (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                No sectors match filters
              </Text>
              <Text
                style={[styles.emptyStateMessage, { color: colors.textSecondary }]}
              >
                Try adjusting your filters to see more results
              </Text>
              <Pressable
                onPress={clearFilters}
                style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Filter Badge
  filterBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  // Legend
  legendContainer: {
    borderRadius: 10,
    padding: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 10,
  },
  // Sectors container
  sectorsContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectorCount: {
    fontSize: 14,
  },
  // Sort options
  sortContainer: {
    marginBottom: 12,
  },
  sortScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectorsList: {
    gap: 8,
  },
  // Sector Row (matching route row format)
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  sectorNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorNumText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectorInfo: {
    flex: 1,
  },
  sectorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectorNameText: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  sectorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 8,
  },
  sectorMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sectorMetaText: {
    fontSize: 12,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  navigateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
