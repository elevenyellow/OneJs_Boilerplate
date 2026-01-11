import { Colors } from '@/constants/Colors'
import { GradeRangeSlider } from '@/components/GradeRangeSlider'
import { useGradeRange } from '@/contexts/FiltersContext'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Sun preference options
type SunPreference = 'any' | 'sun' | 'shade'

export default function FiltersScreen() {
  const {
    sunPreference: sunPreferenceParam,
    minRoutes: minRoutesParam,
    withTopo: withTopoParam,
  } = useLocalSearchParams<{
    sunPreference?: string
    minRoutes?: string
    withTopo?: string
  }>()
  const router = useRouter()
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  const insets = useSafeAreaInsets()

  // Use global grade range from context (shared with Explorer)
  const { gradeRange, setGradeRange } = useGradeRange()

  // Local state for grade range (synced with global on apply)
  const [localGradeMin, setLocalGradeMin] = useState(gradeRange.min)
  const [localGradeMax, setLocalGradeMax] = useState(gradeRange.max)
  const [sunPreference, setSunPreference] = useState<SunPreference>(
    (sunPreferenceParam as SunPreference) || 'any'
  )
  const [minRoutes, setMinRoutes] = useState(() => {
    return minRoutesParam ? parseInt(minRoutesParam, 10) : 0
  })
  const [withTopo, setWithTopo] = useState(() => {
    return withTopoParam === 'true'
  })

  // Clear all filters (reset to defaults but keep global grade range)
  const clearFilters = () => {
    setLocalGradeMin(gradeRange.min)
    setLocalGradeMax(gradeRange.max)
    setSunPreference('any')
    setMinRoutes(0)
    setWithTopo(false)
  }

  // Apply filters and go back
  const applyFilters = () => {
    // Update global grade range (syncs with Explorer)
    setGradeRange({ min: localGradeMin, max: localGradeMax })
    
    router.back()
    router.setParams({
      appliedGradeMin: localGradeMin,
      appliedGradeMax: localGradeMax,
      appliedSunPreference: sunPreference,
      appliedMinRoutes: minRoutes.toString(),
      appliedWithTopo: withTopo.toString(),
    })
  }

  // Count active filters (grade range always counts since it affects scoring)
  const activeFiltersCount =
    1 + // grade range always active
    (sunPreference !== 'any' ? 1 : 0) +
    (minRoutes > 0 ? 1 : 0) +
    (withTopo ? 1 : 0)

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Filter Sectors</Text>
        <Pressable onPress={clearFilters} hitSlop={8}>
          <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Grade Range Filter */}
        <View style={styles.filterSection}>
          <View style={styles.gradeRangeHeader}>
            <GradeRangeSlider
              label="Grade Range"
              minValue={localGradeMin}
              maxValue={localGradeMax}
              onChange={(min, max) => {
                setLocalGradeMin(min)
                setLocalGradeMax(max)
              }}
            />
            <Text style={[styles.gradeRangeNote, { color: colors.textSecondary }]}>
              Shared with Explorer - sectors are sorted by routes in this range
            </Text>
          </View>
        </View>

        {/* Sun Preference Filter */}
        <View style={styles.filterSection}>
          <View style={styles.filterSectionHeader}>
            <Ionicons name="sunny-outline" size={20} color={colors.primary} />
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Sun Preference
            </Text>
          </View>
          <Text style={[styles.filterSectionSubtitle, { color: colors.textSecondary }]}>
            Filter by sun exposure based on current time
          </Text>
          <View style={styles.sunPreferenceRow}>
            {[
              { value: 'any' as SunPreference, label: 'Any', icon: 'contrast-outline' as const },
              { value: 'sun' as SunPreference, label: 'Sun', icon: 'sunny' as const },
              { value: 'shade' as SunPreference, label: 'Shade', icon: 'moon' as const },
            ].map((option) => {
              const isSelected = sunPreference === option.value
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSunPreference(option.value)}
                  style={[
                    styles.sunPreferenceButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.muted,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? '#FFFFFF' : colors.text}
                  />
                  <Text
                    style={[
                      styles.sunPreferenceButtonText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Min Routes Filter */}
        <View style={styles.filterSection}>
          <View style={styles.filterSectionHeader}>
            <Ionicons name="git-branch-outline" size={20} color={colors.primary} />
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Minimum Routes
            </Text>
          </View>
          <Text style={[styles.filterSectionSubtitle, { color: colors.textSecondary }]}>
            Only show sectors with at least this many routes
          </Text>
          <View style={styles.minRoutesRow}>
            {[0, 3, 5, 10, 15].map((count) => {
              const isSelected = minRoutes === count
              return (
                <Pressable
                  key={count}
                  onPress={() => setMinRoutes(count)}
                  style={[
                    styles.minRoutesButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.muted,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.minRoutesButtonText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {count === 0 ? 'Any' : `${count}+`}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* With Topo Filter */}
        <View style={styles.filterSection}>
          <View style={styles.filterSectionHeader}>
            <Ionicons name="map-outline" size={20} color={colors.primary} />
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              With Topo
            </Text>
          </View>
          <View style={[styles.toggleRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                Only show sectors with topo images
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                Filter out sectors without visual route information
              </Text>
            </View>
            <Switch
              value={withTopo}
              onValueChange={setWithTopo}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer with Apply Button */}
      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <Pressable
          onPress={applyFilters}
          style={[styles.applyButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.applyButtonText}>
            Apply Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </Pressable>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterSection: {
    paddingVertical: 20,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  filterSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  filterSectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 30,
  },
  gradeRangeHeader: {
    gap: 8,
  },
  gradeRangeNote: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  sunPreferenceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sunPreferenceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  sunPreferenceButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  minRoutesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  minRoutesButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  minRoutesButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
})
