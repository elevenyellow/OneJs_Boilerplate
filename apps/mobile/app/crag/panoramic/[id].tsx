import { Colors } from '@/constants/Colors'
import type { CragTopoImage, CragTopoSectorPosition } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import Svg, { Ellipse, G, Path, Text as SvgText } from 'react-native-svg'

// Colors for sector overlays
const SECTOR_COLOR = '#FFA500' // Orange for sectors
const SECTOR_HIGHLIGHT_COLOR = '#00FF7F' // Green for highlighted sector

// SVG helper functions
function parsePoints(pointsStr: string): Array<{ x: number; y: number }> {
  if (!pointsStr) return []
  return pointsStr.split(' ').map((pair) => {
    const [x, y] = pair.split(',').map(Number)
    return { x: x || 0, y: y || 0 }
  })
}

function pointsToPolygonPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  return `M ${first.x},${first.y} ${rest.map((p) => `L ${p.x},${p.y}`).join(' ')} Z`
}

function getPolygonBottomCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 }
  
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

function normalizeImageUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `https://www.thecrag.com${url}`
  return url
}

export default function PanoramicTopoScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    id: string
    cragName: string
    topoData: string
    sectorMapping: string
    highlightedSectorId?: string
  }>()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const [imageLoading, setImageLoading] = useState(true)
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(
    params.highlightedSectorId || null
  )

  // Parse topo data from params
  const topo: CragTopoImage | null = useMemo(() => {
    if (!params.topoData) return null
    try {
      return JSON.parse(params.topoData) as CragTopoImage
    } catch {
      return null
    }
  }, [params.topoData])

  // Parse sector name to ID mapping
  const sectorNameToId = useMemo(() => {
    const map = new Map<string, string>()
    if (!params.sectorMapping) return map
    try {
      const mapping = JSON.parse(params.sectorMapping) as Record<string, string>
      for (const [name, id] of Object.entries(mapping)) {
        map.set(name, id)
      }
    } catch {
      // ignore
    }
    return map
  }, [params.sectorMapping])

  // Zoom gesture state
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  if (!topo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Panoramic Topo</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Could not load topo data
          </Text>
        </View>
      </View>
    )
  }

  const imageUrl = normalizeImageUrl(topo.fullImageUrl)
  const screenWidth = Dimensions.get('window').width

  const originalWidth = topo.originalWidth > 0 ? topo.originalWidth : topo.width > 0 ? topo.width : 800
  const originalHeight = topo.originalHeight > 0 ? topo.originalHeight : topo.height > 0 ? topo.height : 600

  const aspectRatio = originalWidth / originalHeight
  const displayWidth = screenWidth
  const displayHeight = displayWidth / aspectRatio

  const sectorPositions: CragTopoSectorPosition[] = Array.isArray(topo.sectorPositions) 
    ? topo.sectorPositions 
    : []

  // Gesture handlers
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
        const maxTranslateX = (displayWidth * (scale.value - 1)) / 2
        const maxTranslateY = (displayHeight * (scale.value - 1)) / 2
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

  const renderSvgOverlay = () => (
    <Svg
      width={displayWidth}
      height={displayHeight}
      viewBox={`0 0 ${originalWidth} ${originalHeight}`}
      style={StyleSheet.absoluteFill}
    >
      {sectorPositions.map((position, index) => {
        const points = parsePoints(position.points)
        if (points.length < 3) return null

        const effectiveSectorId = position.sectorId || 
          sectorNameToId.get(position.areaName.toLowerCase()) || 
          null
        const isHighlighted = effectiveSectorId === selectedSectorId
        const pathData = pointsToPolygonPath(points)
        const bottomCenter = getPolygonBottomCenter(points)
        const lineColor = isHighlighted ? SECTOR_HIGHLIGHT_COLOR : SECTOR_COLOR
        const lineWidth = isHighlighted ? 4 : 2.5
        const labelSize = isHighlighted ? 22 : 18
        const fontSize = isHighlighted ? 11 : 9
        const labelOffset = 14
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

  const handleSectorPress = (position: CragTopoSectorPosition) => {
    const effectiveSectorId = position.sectorId || 
      sectorNameToId.get(position.areaName.toLowerCase()) || 
      null
    if (effectiveSectorId) {
      setSelectedSectorId(prev => prev === effectiveSectorId ? null : effectiveSectorId)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {params.cragName || 'Panoramic Topo'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Pinch to zoom • Double tap to enlarge
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Zoomable Image */}
      <GestureHandlerRootView style={[styles.imageContainer, { height: Math.min(displayHeight, 300) }]}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.animatedImage, { width: displayWidth, height: displayHeight }, animatedStyle]}>
            <Image 
              source={{ uri: imageUrl }} 
              style={{ width: displayWidth, height: displayHeight }} 
              resizeMode="contain"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {!imageLoading && renderSvgOverlay()}
            {imageLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {/* Sector List */}
      <View style={[styles.sectorListContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.sectorListHeader}>
          <Ionicons name="layers-outline" size={18} color={colors.primary} />
          <Text style={[styles.sectorListTitle, { color: colors.text }]}>Sectors</Text>
          <Text style={[styles.sectorListCount, { color: colors.textSecondary }]}>
            {sectorPositions.length}
          </Text>
        </View>
        <ScrollView 
          style={styles.sectorListScroll}
          showsVerticalScrollIndicator={true}
        >
          {sectorPositions.map((position) => {
            const effectiveSectorId = position.sectorId || 
              sectorNameToId.get(position.areaName.toLowerCase()) || 
              null
            const isHighlighted = effectiveSectorId === selectedSectorId
            return (
              <Pressable 
                key={position.externalAreaId || position.areaNumber} 
                style={[
                  styles.sectorListItem,
                  { 
                    backgroundColor: isHighlighted ? colors.primary + '15' : colors.muted,
                    borderColor: isHighlighted ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => handleSectorPress(position)}
              >
                <View style={[
                  styles.sectorListBadge,
                  { backgroundColor: isHighlighted ? SECTOR_HIGHLIGHT_COLOR : SECTOR_COLOR }
                ]}>
                  <Text style={styles.sectorListBadgeText}>{position.areaNumber}</Text>
                </View>
                <Text style={[
                  styles.sectorListName,
                  { color: isHighlighted ? colors.primary : colors.text }
                ]} numberOfLines={1}>
                  {position.areaName}
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={18} 
                  color={isHighlighted ? colors.primary : colors.textSecondary} 
                />
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
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
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  animatedImage: {
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sectorListContainer: {
    flex: 1,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectorListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectorListTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sectorListCount: {
    fontSize: 14,
  },
  sectorListScroll: {
    flex: 1,
  },
  sectorListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  sectorListBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorListBadgeText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  sectorListName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
})
