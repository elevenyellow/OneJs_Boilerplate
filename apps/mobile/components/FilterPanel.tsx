import React, { forwardRef, useImperativeHandle, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native'
import { useColorScheme } from 'react-native'
import * as Haptics from 'expo-haptics'
import Slider from '@react-native-community/slider'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, OrientationGradients } from '@/constants/Colors'
import type { SearchSectorsDto } from '@/lib/api'
import { LocationPicker } from './LocationPicker'
import type { CustomLocation } from '@/hooks/useUserLocation'

interface FilterPanelProps {
  filters: Partial<SearchSectorsDto>
  onFiltersChange: (filters: Partial<SearchSectorsDto>) => void
  onApply: () => void
  // Location props
  locationName?: string
  isCustomLocation?: boolean
  onLocationChange?: (location: CustomLocation) => void
  onResetToGPS?: () => void
  gpsLocation?: { latitude: number | null; longitude: number | null }
}

export interface FilterPanelRef {
  open: () => void
  close: () => void
}

// Grade options for the slider
const GRADES = [
  '4a',
  '4b',
  '4c',
  '5a',
  '5b',
  '5c',
  '6a',
  '6a+',
  '6b',
  '6b+',
  '6c',
  '6c+',
  '7a',
  '7a+',
  '7b',
  '7b+',
  '7c',
  '7c+',
  '8a',
  '8a+',
  '8b',
  '8b+',
  '8c',
]

const gradeToIndex = (grade: string): number => {
  const idx = GRADES.indexOf(grade)
  return idx !== -1 ? idx : 10
}

const indexToGrade = (index: number): string => {
  return GRADES[Math.round(index)] || '6a'
}

export const FilterPanel = forwardRef<FilterPanelRef, FilterPanelProps>(
  ({ 
    filters, 
    onFiltersChange, 
    onApply,
    locationName = 'Tu ubicación',
    isCustomLocation = false,
    onLocationChange,
    onResetToGPS,
    gpsLocation,
  }, ref) => {
    const colorScheme = useColorScheme() ?? 'light'
    const colors = Colors[colorScheme]
    const [visible, setVisible] = useState(false)
    const [locationPickerVisible, setLocationPickerVisible] = useState(false)

    // Local state for sliders - use refs for slider values to avoid re-render loops
    const [localDistance, setLocalDistance] = useState(filters.maxDistance || 100)
    const [displayDistance, setDisplayDistance] = useState(filters.maxDistance || 100)
    const [localMinGrade, setLocalMinGrade] = useState(
      gradeToIndex(filters.gradeRange?.min || '5c') ?? 10 // 10 is index for '5c'
    )
    const [localMaxGrade, setLocalMaxGrade] = useState(
      gradeToIndex(filters.gradeRange?.max || '6c') ?? 16 // 16 is index for '6c'
    )
    const [displayMinGrade, setDisplayMinGrade] = useState(localMinGrade)
    const [displayMaxGrade, setDisplayMaxGrade] = useState(localMaxGrade)
    const [localOrientation, setLocalOrientation] = useState<'sun' | 'shade' | 'any'>(
      filters.forceOrientation || 'any'
    )
    const [localHasTopo, setLocalHasTopo] = useState(filters.hasTopo || false)
    const [localMinRoutes, setLocalMinRoutes] = useState(filters.minRoutes || 0)
    const [displayMinRoutes, setDisplayMinRoutes] = useState(filters.minRoutes || 0)

    useImperativeHandle(ref, () => ({
      open: () => {
        // Reset local state to current filters
        const minGradeIdx = gradeToIndex(filters.gradeRange?.min || '5c') ?? 10
        const maxGradeIdx = gradeToIndex(filters.gradeRange?.max || '6c') ?? 16
        setLocalDistance(filters.maxDistance || 100)
        setDisplayDistance(filters.maxDistance || 100)
        setLocalMinGrade(minGradeIdx)
        setLocalMaxGrade(maxGradeIdx)
        setDisplayMinGrade(minGradeIdx)
        setDisplayMaxGrade(maxGradeIdx)
        setLocalOrientation(filters.forceOrientation || 'any')
        setLocalHasTopo(filters.hasTopo || false)
        setLocalMinRoutes(filters.minRoutes || 0)
        setDisplayMinRoutes(filters.minRoutes || 0)
        setVisible(true)
      },
      close: () => setVisible(false),
    }))

    const handleApply = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Ensure min <= max
      const minIdx = Math.min(displayMinGrade, displayMaxGrade)
      const maxIdx = Math.max(displayMinGrade, displayMaxGrade)

      onFiltersChange({
        ...filters,
        maxDistance: displayDistance,
        gradeRange: {
          min: indexToGrade(minIdx),
          max: indexToGrade(maxIdx),
        },
        forceOrientation: localOrientation === 'any' ? undefined : localOrientation,
        hasTopo: localHasTopo || undefined,
        minRoutes: displayMinRoutes > 0 ? displayMinRoutes : undefined,
      })
      onApply()
      setVisible(false)
    }

    const handleReset = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      const minIdx = gradeToIndex('5c') ?? 10
      const maxIdx = gradeToIndex('6c') ?? 16
      setLocalDistance(100)
      setDisplayDistance(100)
      setLocalMinGrade(minIdx)
      setLocalMaxGrade(maxIdx)
      setDisplayMinGrade(minIdx)
      setDisplayMaxGrade(maxIdx)
      setLocalOrientation('any')
      setLocalHasTopo(false)
      setLocalMinRoutes(0)
      setDisplayMinRoutes(0)
    }

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
            <Pressable onPress={handleReset}>
              <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search Zone / Location */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="navigate" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Zona de búsqueda
                </Text>
              </View>
              
              <Pressable
                style={({ pressed }) => [
                  styles.locationSelector,
                  { 
                    backgroundColor: pressed ? colors.muted : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setLocationPickerVisible(true)
                }}
              >
                <View style={[styles.locationIconContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons 
                    name={isCustomLocation ? 'location' : 'locate'} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={[styles.locationTitle, { color: colors.text }]} numberOfLines={1}>
                    {locationName}
                  </Text>
                  <Text style={[styles.locationSubtitle, { color: colors.textSecondary }]}>
                    {isCustomLocation ? 'Ubicación personalizada' : 'Ubicación GPS'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </Pressable>

              {isCustomLocation && onResetToGPS && (
                <Pressable
                  style={({ pressed }) => [
                    styles.resetLocationButton,
                    { 
                      backgroundColor: pressed ? colors.muted : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                    onResetToGPS()
                  }}
                >
                  <Ionicons name="locate" size={16} color={colors.primary} />
                  <Text style={[styles.resetLocationText, { color: colors.primary }]}>
                    Volver a mi ubicación GPS
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Distance Slider */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Maximum distance
                </Text>
              </View>
              <Text style={[styles.valueDisplay, { color: colors.primary }]}>
                {Math.round(displayDistance)} km
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={200}
                step={5}
                value={localDistance}
                onValueChange={(val) => setDisplayDistance(Math.round(val))}
                onSlidingComplete={(val) => {
                  const rounded = Math.round(val)
                  setLocalDistance(rounded)
                  setDisplayDistance(rounded)
                }}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                  10 km
                </Text>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                  200 km
                </Text>
              </View>
            </View>

            {/* Grade Range */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Difficulty range
                </Text>
              </View>
              <Text style={[styles.valueDisplay, { color: colors.primary }]}>
                {indexToGrade(Math.min(displayMinGrade, displayMaxGrade))} -{' '}
                {indexToGrade(Math.max(displayMinGrade, displayMaxGrade))}
              </Text>

              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                Minimum grade: {indexToGrade(displayMinGrade)}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={GRADES.length - 1}
                step={1}
                value={localMinGrade}
                onValueChange={(val) => setDisplayMinGrade(Math.round(val))}
                onSlidingComplete={(val) => {
                  const rounded = Math.round(val)
                  setLocalMinGrade(rounded)
                  setDisplayMinGrade(rounded)
                }}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />

              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                Maximum grade: {indexToGrade(displayMaxGrade)}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={GRADES.length - 1}
                step={1}
                value={localMaxGrade}
                onValueChange={(val) => setDisplayMaxGrade(Math.round(val))}
                onSlidingComplete={(val) => {
                  const rounded = Math.round(val)
                  setLocalMaxGrade(rounded)
                  setDisplayMaxGrade(rounded)
                }}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />

              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                  {GRADES[0]}
                </Text>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                  {GRADES[GRADES.length - 1]}
                </Text>
              </View>
            </View>

            {/* Orientation */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sunny" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Preferred orientation
                </Text>
              </View>
              <View style={styles.orientationOptions}>
                {[
                  { value: 'sun', label: 'Sun', icon: 'sunny', gradientKey: 'sun' as const, description: 'Sunny walls' },
                  { value: 'shade', label: 'Shade', icon: 'moon', gradientKey: 'shade' as const, description: 'Shaded walls' },
                  { value: 'any', label: 'Any', icon: 'apps', gradientKey: 'neutral' as const, description: 'No preference' },
                ].map((option) => {
                  const isSelected = localOrientation === option.value
                  const gradient = OrientationGradients[option.gradientKey][colorScheme]
                  
                  return (
                    <Pressable
                      key={option.value}
                      style={({ pressed }) => [
                        styles.orientationButtonWrapper,
                        pressed && styles.orientationButtonPressed,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        setLocalOrientation(option.value as 'sun' | 'shade' | 'any')
                      }}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={gradient as [string, string, ...string[]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.orientationButton}
                        >
                          <View style={styles.orientationIconContainer}>
                            <Ionicons
                              name={option.icon as keyof typeof Ionicons.glyphMap}
                              size={32}
                              color="#FFFFFF"
                            />
                          </View>
                          <Text style={[styles.orientationLabel, { color: '#FFFFFF' }]}>
                            {option.label}
                          </Text>
                          <Text style={[styles.orientationDescription, { color: 'rgba(255,255,255,0.8)' }]}>
                            {option.description}
                          </Text>
                          <View style={styles.orientationCheck}>
                            <Ionicons name="checkmark-circle" size={18} color="rgba(255,255,255,0.9)" />
                          </View>
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            styles.orientationButton,
                            styles.orientationButtonUnselected,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View style={[styles.orientationIconContainer, styles.orientationIconUnselected]}>
                            <Ionicons
                              name={option.icon as keyof typeof Ionicons.glyphMap}
                              size={28}
                              color={colors.textSecondary}
                            />
                          </View>
                          <Text style={[styles.orientationLabel, { color: colors.text }]}>
                            {option.label}
                          </Text>
                          <Text style={[styles.orientationDescription, { color: colors.textSecondary }]}>
                            {option.description}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* Minimum Routes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="git-branch" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Minimum routes
                </Text>
              </View>
              <Text style={[styles.valueDisplay, { color: colors.primary }]}>
                {displayMinRoutes === 0 ? 'No minimum' : `${displayMinRoutes}+ routes`}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={50}
                step={5}
                value={localMinRoutes}
                onValueChange={(val) => setDisplayMinRoutes(Math.round(val))}
                onSlidingComplete={(val) => {
                  const rounded = Math.round(val)
                  setLocalMinRoutes(rounded)
                  setDisplayMinRoutes(rounded)
                }}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                  No minimum
                </Text>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
                  50+
                </Text>
              </View>
            </View>

            {/* Toggle Options */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="options" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Additional options
                </Text>
              </View>

              <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
                <View style={styles.switchInfo}>
                  <Ionicons name="map" size={22} color={colors.text} />
                  <View>
                    <Text style={[styles.switchTitle, { color: colors.text }]}>
                      With topo/sketch
                    </Text>
                    <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                      Only sectors with detailed info
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localHasTopo}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setLocalHasTopo(value)
                  }}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Spacer for bottom button */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Apply Button */}
          <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <Pressable
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Ionicons name="checkmark" size={24} color={colors.primaryForeground} />
              <Text style={[styles.applyButtonText, { color: colors.primaryForeground }]}>
                Apply filters
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Location Picker Modal */}
        <LocationPicker
          visible={locationPickerVisible}
          onClose={() => setLocationPickerVisible(false)}
          onSelect={(location) => {
            if (onLocationChange) {
              onLocationChange(location)
            }
          }}
          currentLocation={isCustomLocation ? {
            lat: filters.userLocation?.lat ?? 0,
            lon: filters.userLocation?.lon ?? 0,
            name: locationName,
          } : null}
          gpsLocation={gpsLocation}
        />
      </Modal>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 24,
    borderBottomWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  valueDisplay: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  slider: {
    width: '100%',
    height: 50,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 13,
  },
  orientationOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  orientationButtonWrapper: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  orientationButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  orientationButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 6,
    minHeight: 140,
  },
  orientationButtonUnselected: {
    borderWidth: 1.5,
  },
  orientationIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  orientationIconUnselected: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  orientationLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  orientationDescription: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  orientationCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  resetLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  resetLocationText: {
    fontSize: 14,
    fontWeight: '500',
  },
})
