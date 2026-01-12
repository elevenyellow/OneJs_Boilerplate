import { LanguageTextSection } from '@/components/LanguageTextSection'
import { Colors } from '@/constants/Colors'
import { useCragDetail } from '@/hooks/useCragDetail'
import { t } from '@/lib/i18n'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ParkingLocation {
  name: string
  lat: number
  lon: number
}

/**
 * Extract all parking coordinates from text (approach + description)
 * Strategy:
 * 1. Find all coordinate pairs in the text
 * 2. For each coordinate, check if "parking" is mentioned within ~150 chars
 * 3. Try to extract a name from context near the parking keyword
 */
function extractParkingLocations(text: string): ParkingLocation[] {
  if (!text) return []
  
  const parkings: ParkingLocation[] = []
  
  // Normalize text
  const normalizedText = text.replace(/:parking:/g, '🅿️')
  
  // Find all coordinate pairs in text
  // Matches: "39.123456, -0.123456" or "39,123456 -0,123456" etc.
  const coordPattern = /([-]?\d{1,3}[.,]\d{3,8})\s*[,\s]\s*([-]?\d{1,3}[.,]\d{3,8})/g
  
  let coordMatch = coordPattern.exec(normalizedText)
  while (coordMatch !== null) {
    const lat = parseFloat(coordMatch[1].replace(',', '.'))
    const lon = parseFloat(coordMatch[2].replace(',', '.'))
    const matchIndex = coordMatch.index
    const matchEnd = matchIndex + coordMatch[0].length
    
    // Validate coordinates are reasonable for lat/lon
    if (isValidCoordinate(lat, lon)) {
      // Check context around coordinates (150 chars before and after)
      const contextStart = Math.max(0, matchIndex - 150)
      const contextEnd = Math.min(normalizedText.length, matchEnd + 150)
      const context = normalizedText.substring(contextStart, contextEnd)
      
      // Check if parking is mentioned in context
      const parkingKeywords = /parking|aparcar|aparcamiento|🅿️/gi
      if (parkingKeywords.test(context)) {
        addParking(parkings, lat, lon)
      }
    }
    
    coordMatch = coordPattern.exec(normalizedText)
  }
  
  return parkings
}

function isValidCoordinate(lat: number, lon: number): boolean {
  return !isNaN(lat) && !isNaN(lon) && 
         lat >= -90 && lat <= 90 && 
         lon >= -180 && lon <= 180
}

function addParking(parkings: ParkingLocation[], lat: number, lon: number) {
  // Check for duplicate coordinates
  const isDuplicate = parkings.some(
    p => Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lon - lon) < 0.0001
  )
  
  if (isDuplicate) return
  
  // Name based on order: "Parking 1", "Parking 2", etc.
  const parkingNumber = parkings.length + 1
  const name = `Parking ${parkingNumber}`
  
  parkings.push({ name, lat, lon })
}

/**
 * Open navigation app with coordinates
 */
function openNavigationToCoordinates(lat: number, lon: number) {
  const url = Platform.select({
    ios: `maps:?daddr=${lat},${lon}`,
    android: `google.navigation:q=${lat},${lon}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
  })
  
  Linking.openURL(url)
}

export default function InfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  const { data: crag, isLoading } = useCragDetail(id)

  // Extract all parking locations from approach + description text
  const parkingLocations = useMemo(() => {
    const combinedText = [crag?.approach, crag?.description].filter(Boolean).join('\n\n')
    if (!combinedText) return []
    return extractParkingLocations(combinedText)
  }, [crag?.approach, crag?.description])

  const handleNavigateToParking = (parking: ParkingLocation) => {
    openNavigationToCoordinates(parking.lat, parking.lon)
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
          <LanguageTextSection
            text={crag.description}
            title={t('description')}
          />
        )}

        {/* Approach */}
        {crag.approach && (
          <LanguageTextSection
            text={crag.approach}
            title={t('approach')}
            showMapButton={!!crag.latitude && !!crag.longitude}
            latitude={crag.latitude}
            longitude={crag.longitude}
            locationName={crag.name}
          />
        )}
        
        {/* Parking buttons - shown for each parking detected in approach text */}
        {parkingLocations.length > 0 && (
          <View style={styles.parkingContainer}>
            {parkingLocations.map((parking, index) => (
              <Pressable
                key={`parking-${index}-${parking.lat}`}
                onPress={() => handleNavigateToParking(parking)}
                style={[styles.parkingButton, { backgroundColor: '#3B82F6' }]}
              >
                <Ionicons name="car" size={20} color="#FFF" />
                <Text style={styles.parkingButtonText}>
                  {parkingLocations.length > 1 ? parking.name : 'Navigate to Parking'}
                </Text>
                <Ionicons name="navigate" size={16} color="#FFF" />
              </Pressable>
            ))}
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
  parkingContainer: {
    marginTop: 12,
    gap: 8,
  },
  parkingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  parkingButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
})
