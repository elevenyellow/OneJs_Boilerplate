import { Colors } from '@/constants/Colors'
import type { RouteSearchInfo, TopoImage, TopoRoutePosition } from '@/lib/api'
import { gradeToIndex } from '@/utils/gradeConverter'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
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

interface TopoViewerProps {
  topo: TopoImage
  highlightedRouteId?: string
  gradeRange?: { min: number; max: number }
  onRoutePress?: (route: TopoRoutePosition) => void
  showRouteList?: boolean
  routeDetails?: RouteSearchInfo[]
}

// Colors
const ROUTE_COLOR = '#FFEA00' // Yellow for all non-selected routes
const HIGHLIGHT_COLOR = '#00FF7F' // Green for selected route

/**
 * Parse points string into coordinate array
 */
function parsePoints(
  pointsStr: string,
): Array<{ x: number; y: number; marker?: string }> {
  if (!pointsStr || typeof pointsStr !== 'string') {
    return []
  }

  const points: Array<{ x: number; y: number; marker?: string }> = []
  const segments = pointsStr.split(',')

  for (const segment of segments) {
    const trimmed = segment.trim()
    if (!trimmed) continue

    const parts = trimmed.split(/\s+/)
    if (parts.length >= 2) {
      const x = parseFloat(parts[0])
      const y = parseFloat(parts[1])

      if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
        const point: { x: number; y: number; marker?: string } = { x, y }
        if (parts.length >= 3 && isNaN(parseFloat(parts[2]))) {
          point.marker = parts[2]
        }
        points.push(point)
      }
    }
  }

  return points
}

/**
 * Convert points to Bézier curve path for smooth lines
 */
function pointsToBezierPath(points: Array<{ x: number; y: number }>): string {
  if (!points || points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const tension = 6
    const cp1x = p1.x + (p2.x - p0.x) / tension
    const cp1y = p1.y + (p2.y - p0.y) / tension
    const cp2x = p2.x - (p3.x - p1.x) / tension
    const cp2y = p2.y - (p3.y - p1.y) / tension

    if (isFinite(cp1x) && isFinite(cp1y) && isFinite(cp2x) && isFinite(cp2y)) {
      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    } else {
      path += ` L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }
  }

  return path
}

/**
 * Get grade index from grade string for filtering
 * Uses gradeToIndex from gradeConverter for consistency with backend
 */
function getGradeIndex(grade: string | null): number {
  if (!grade) return 0
  return gradeToIndex(grade) ?? 0
}

// Normalize image URLs
const normalizeImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `https://www.thecrag.com${url}`
  return url
}

// Zoomable Image Component for fullscreen modal
function ZoomableTopoImage({
  imageUrl,
  routes,
  selectedRoute,
  originalWidth,
  originalHeight,
  onClose,
}: {
  imageUrl: string
  routes: TopoRoutePosition[]
  selectedRoute: string | null
  originalWidth: number
  originalHeight: number
  onClose: () => void
}) {
  const screenWidth = Dimensions.get('window').width

  const aspectRatio = originalWidth / originalHeight
  const displayWidth = screenWidth
  const displayHeight = displayWidth / aspectRatio

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
        const maxTranslateX = (displayWidth * (scale.value - 1)) / 2
        const maxTranslateY = (displayHeight * (scale.value - 1)) / 2

        translateX.value = Math.min(
          Math.max(savedTranslateX.value + event.translationX, -maxTranslateX),
          maxTranslateX,
        )
        translateY.value = Math.min(
          Math.max(savedTranslateY.value + event.translationY, -maxTranslateY),
          maxTranslateY,
        )
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

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return (
    <View style={styles.zoomModalContainer}>
      <Pressable style={styles.zoomCloseButton} onPress={onClose}>
        <Ionicons name="close" size={32} color="#fff" />
      </Pressable>

      <Text style={styles.zoomHintText}>
        Pellizca para zoom • Doble tap para ampliar
      </Text>

      <GestureHandlerRootView style={styles.zoomGestureContainer}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.zoomImageContainer,
              { width: displayWidth, height: displayHeight },
              animatedStyle,
            ]}
          >
            <Image
              source={{ uri: imageUrl }}
              style={{ width: displayWidth, height: displayHeight }}
              resizeMode="contain"
            />

            <Svg
              width={displayWidth}
              height={displayHeight}
              viewBox={`0 0 ${originalWidth} ${originalHeight}`}
              style={StyleSheet.absoluteFill}
            >
              {routes.map((route, index) => {
                const points = parsePoints(route.points)
                if (points.length < 2) return null

                const isSelected = route.routeId === selectedRoute
                const lineColor = isSelected ? HIGHLIGHT_COLOR : ROUTE_COLOR
                const lineWidth = isSelected ? 4 : 2.5

                const pathData = pointsToBezierPath(points)
                const startPoint = points[0]
                const endPoint = points[points.length - 1]
                const labelSize = isSelected ? 28 : 22
                const fontSize = isSelected ? 14 : 12

                return (
                  <G key={route.routeId || `route-${index}`}>
                    {/* Black outline */}
                    <Path
                      d={pathData}
                      stroke="#000"
                      strokeWidth={lineWidth + 3}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                    />
                    {/* White outline */}
                    <Path
                      d={pathData}
                      stroke="#fff"
                      strokeWidth={lineWidth + 1.5}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Main line */}
                    <Path
                      d={pathData}
                      stroke={lineColor}
                      strokeWidth={lineWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* End anchor */}
                    {endPoint.marker && (
                      <>
                        <Ellipse
                          cx={endPoint.x}
                          cy={endPoint.y}
                          rx={isSelected ? 10 : 6}
                          ry={isSelected ? 10 : 6}
                          fill="#000"
                          opacity={0.6}
                        />
                        <Ellipse
                          cx={endPoint.x}
                          cy={endPoint.y}
                          rx={isSelected ? 8 : 5}
                          ry={isSelected ? 8 : 5}
                          fill={lineColor}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      </>
                    )}

                    {/* Route number */}
                    {route.topoNumber && (
                      <G>
                        <Ellipse
                          cx={startPoint.x + 1}
                          cy={startPoint.y + 1}
                          rx={labelSize / 2 + 2}
                          ry={labelSize / 2 + 2}
                          fill="#000"
                          opacity={0.5}
                        />
                        <Ellipse
                          cx={startPoint.x}
                          cy={startPoint.y}
                          rx={labelSize / 2 + 2}
                          ry={labelSize / 2 + 2}
                          fill="#fff"
                        />
                        <Ellipse
                          cx={startPoint.x}
                          cy={startPoint.y}
                          rx={labelSize / 2}
                          ry={labelSize / 2}
                          fill={isSelected ? HIGHLIGHT_COLOR : ROUTE_COLOR}
                        />
                        <SvgText
                          x={startPoint.x}
                          y={startPoint.y + fontSize / 3}
                          textAnchor="middle"
                          fontSize={fontSize}
                          fontWeight="bold"
                          fill={isSelected ? '#000' : '#000'}
                        >
                          {route.topoNumber}
                        </SvgText>
                      </G>
                    )}
                  </G>
                )
              })}
            </Svg>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </View>
  )
}

export function TopoViewer({
  topo,
  highlightedRouteId,
  gradeRange,
  onRoutePress,
  showRouteList = true,
  routeDetails,
}: TopoViewerProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(
    highlightedRouteId || null,
  )
  const [zoomModalVisible, setZoomModalVisible] = useState(false)

  useEffect(() => {
    if (highlightedRouteId !== undefined) {
      setSelectedRoute(highlightedRouteId)
    }
  }, [highlightedRouteId])

  const imageUrl = normalizeImageUrl(topo.fullImageUrl)

  const screenWidth = Dimensions.get('window').width
  const maxWidth = screenWidth - 32

  const originalWidth =
    topo.originalWidth > 0
      ? topo.originalWidth
      : topo.width > 0
        ? topo.width
        : 800
  const originalHeight =
    topo.originalHeight > 0
      ? topo.originalHeight
      : topo.height > 0
        ? topo.height
        : 600

  const aspectRatio = originalWidth / originalHeight
  const displayWidth = Math.min(maxWidth, originalWidth)
  const displayHeight =
    aspectRatio > 0 ? displayWidth / aspectRatio : displayWidth * 0.75

  const routes = Array.isArray(topo.routes) ? topo.routes : []

  const selectedRouteInfo = useMemo(() => {
    return routes.find((r) => r.routeId === selectedRoute) || null
  }, [routes, selectedRoute])

  const selectedRouteDetails = useMemo(() => {
    if (!routeDetails || !selectedRoute) return null
    return routeDetails.find((r) => r.id === selectedRoute) || null
  }, [routeDetails, selectedRoute])

  const routesInRange = useMemo(() => {
    if (!gradeRange) return new Set<string>()

    return new Set(
      routes
        .filter((r) => {
          const idx = getGradeIndex(r.grade)
          return idx >= gradeRange.min && idx <= gradeRange.max
        })
        .map((r) => r.routeId),
    )
  }, [routes, gradeRange])

  const handleRoutePress = (route: TopoRoutePosition) => {
    setSelectedRoute(route.routeId)
    onRoutePress?.(route)
  }

  if (imageError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.muted }]}>
        <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Error al cargar la imagen
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header - Selected Route */}
      {selectedRouteInfo && (
        <View
          style={[styles.headerContainer, { backgroundColor: HIGHLIGHT_COLOR }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerNumber}>
              <Text style={styles.headerNumberText}>
                {selectedRouteInfo.topoNumber}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>
                {selectedRouteInfo.name}
              </Text>
              <Text style={styles.headerGrade}>{selectedRouteInfo.grade}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Topo Image - Tap to zoom */}
      <Pressable onPress={() => setZoomModalVisible(true)}>
        <View
          style={[
            styles.topoContainer,
            { width: displayWidth, height: displayHeight },
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.baseImage,
              { width: displayWidth, height: displayHeight },
            ]}
            resizeMode="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => setImageError(true)}
          />

          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {/* SVG Overlay - All routes YELLOW, selected GREEN, NO glow */}
          {!imageLoading && originalWidth > 0 && originalHeight > 0 && (
            <Svg
              width={displayWidth}
              height={displayHeight}
              viewBox={`0 0 ${originalWidth} ${originalHeight}`}
              style={styles.svgOverlay}
            >
              {[...routes]
                .sort((a, b) => {
                  const aSelected = a.routeId === selectedRoute ? 1 : 0
                  const bSelected = b.routeId === selectedRoute ? 1 : 0
                  return aSelected - bSelected
                })
                .map((route, index) => {
                  const points = parsePoints(route.points)
                  if (points.length < 2) return null

                  const isSelected = route.routeId === selectedRoute
                  // ALL routes are YELLOW, selected is GREEN
                  const lineColor = isSelected ? HIGHLIGHT_COLOR : ROUTE_COLOR
                  const lineWidth = isSelected ? 4 : 2.5

                  const pathData = pointsToBezierPath(points)
                  const startPoint = points[0]
                  const endPoint = points[points.length - 1]

                  const labelSize = isSelected ? 28 : 22
                  const fontSize = isSelected ? 14 : 12

                  return (
                    <G key={route.routeId || `route-${index}`}>
                      {/* BLACK outline for contrast */}
                      <Path
                        d={pathData}
                        stroke="#000"
                        strokeWidth={lineWidth + 3}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.9}
                      />

                      {/* WHITE outline */}
                      <Path
                        d={pathData}
                        stroke="#fff"
                        strokeWidth={lineWidth + 1.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Main colored line */}
                      <Path
                        d={pathData}
                        stroke={lineColor}
                        strokeWidth={lineWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* End anchor */}
                      {endPoint.marker && (
                        <>
                          <Ellipse
                            cx={endPoint.x}
                            cy={endPoint.y}
                            rx={isSelected ? 10 : 6}
                            ry={isSelected ? 10 : 6}
                            fill="#000"
                            opacity={0.6}
                          />
                          <Ellipse
                            cx={endPoint.x}
                            cy={endPoint.y}
                            rx={isSelected ? 8 : 5}
                            ry={isSelected ? 8 : 5}
                            fill={lineColor}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        </>
                      )}

                      {/* Route number */}
                      {route.topoNumber && (
                        <G>
                          {/* Shadow */}
                          <Ellipse
                            cx={startPoint.x + 1}
                            cy={startPoint.y + 1}
                            rx={labelSize / 2 + 2}
                            ry={labelSize / 2 + 2}
                            fill="#000"
                            opacity={0.5}
                          />
                          {/* White border */}
                          <Ellipse
                            cx={startPoint.x}
                            cy={startPoint.y}
                            rx={labelSize / 2 + 2}
                            ry={labelSize / 2 + 2}
                            fill="#fff"
                          />
                          {/* Colored background */}
                          <Ellipse
                            cx={startPoint.x}
                            cy={startPoint.y}
                            rx={labelSize / 2}
                            ry={labelSize / 2}
                            fill={isSelected ? HIGHLIGHT_COLOR : ROUTE_COLOR}
                          />
                          {/* Number text */}
                          <SvgText
                            x={startPoint.x}
                            y={startPoint.y + fontSize / 3}
                            textAnchor="middle"
                            fontSize={fontSize}
                            fontWeight="bold"
                            fill="#000"
                          >
                            {route.topoNumber}
                          </SvgText>
                        </G>
                      )}
                    </G>
                  )
                })}
            </Svg>
          )}

          {/* Zoom icon overlay */}
          <View style={styles.zoomIconOverlay}>
            <Ionicons name="expand-outline" size={24} color="#fff" />
          </View>
        </View>
      </Pressable>

      {/* Zoom Modal */}
      <Modal
        visible={zoomModalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setZoomModalVisible(false)}
      >
        <ZoomableTopoImage
          imageUrl={imageUrl}
          routes={routes}
          selectedRoute={selectedRoute}
          originalWidth={originalWidth}
          originalHeight={originalHeight}
          onClose={() => setZoomModalVisible(false)}
        />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerContainer: {
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerNumberText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerGrade: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    opacity: 0.8,
    marginTop: 2,
  },
  topoContainer: {
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    position: 'relative',
  },
  baseImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
  },
  zoomIconOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
  // Zoom Modal
  zoomModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  zoomHintText: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  zoomGestureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImageContainer: {
    position: 'relative',
  },
  // Details Panel
  detailsPanel: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 70,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  firstAscentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  firstAscentText: {
    fontSize: 13,
    flex: 1,
  },
  // Route List
  routeList: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 400,
  },
  routeListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  routeListTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  routeCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  routeScroll: {
    flex: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: 'relative',
  },
  routeRowSelected: {
    borderLeftWidth: 4,
  },
  colNum: {
    width: 40,
    alignItems: 'center',
  },
  colName: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colGrade: {
    width: 50,
    alignItems: 'center',
  },
  colHeight: {
    width: 45,
    alignItems: 'center',
  },
  colBolts: {
    width: 35,
    alignItems: 'center',
  },
  colStars: {
    width: 45,
    alignItems: 'center',
  },
  routeNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeName: {
    fontSize: 13,
    fontWeight: '500',
  },
  routeNameSelected: {
    fontWeight: '700',
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 12,
  },
  starsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inRangeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  routeRowNotInTopo: {
    opacity: 0.6,
  },
})
