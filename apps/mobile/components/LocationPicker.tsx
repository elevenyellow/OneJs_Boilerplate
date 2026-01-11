import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native'
import { useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '@/constants/Colors'
import { type CustomLocation, POPULAR_ZONES } from '@/hooks/useUserLocation'

interface LocationPickerProps {
  visible: boolean
  onClose: () => void
  onSelect: (location: CustomLocation) => void
  currentLocation?: CustomLocation | null
  gpsLocation?: { latitude: number | null; longitude: number | null }
}

export function LocationPicker({
  visible,
  onClose,
  onSelect,
  currentLocation,
  gpsLocation,
}: LocationPickerProps) {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<CustomLocation[]>([])

  // Filter popular zones by search query
  const filteredZones = searchQuery.trim()
    ? POPULAR_ZONES.filter((zone) =>
        zone.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_ZONES

  const handleSelectGPS = useCallback(() => {
    if (gpsLocation?.latitude && gpsLocation?.longitude) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onSelect({
        lat: gpsLocation.latitude,
        lon: gpsLocation.longitude,
        name: 'Tu ubicación actual',
      })
      // Pass null to indicate reset to GPS
      onClose()
    }
  }, [gpsLocation, onSelect, onClose])

  const handleSelectZone = useCallback((zone: CustomLocation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelect(zone)
    onClose()
    setSearchQuery('')
  }, [onSelect, onClose])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    Keyboard.dismiss()
    setIsSearching(true)
    
    try {
      // Use Nominatim (OpenStreetMap) for geocoding - free and no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            'User-Agent': 'ClimbZone/1.0',
          },
        }
      )
      
      const data = await response.json()
      
      interface NominatimResult {
        lat: string
        lon: string
        display_name: string
      }
      
      const results: CustomLocation[] = (data as NominatimResult[]).map((item) => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        name: item.display_name.split(',').slice(0, 2).join(','),
      }))
      
      setSearchResults(results)
    } catch (error) {
      console.error('[LocationPicker] Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])

  const renderLocationItem = ({ item }: { item: CustomLocation }) => {
    const isSelected = currentLocation?.lat === item.lat && currentLocation?.lon === item.lon
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.locationItem,
          { 
            backgroundColor: pressed ? colors.muted : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleSelectZone(item)}
      >
        <View style={styles.locationItemContent}>
          <Ionicons
            name="location"
            size={20}
            color={isSelected ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.locationName,
              { color: colors.text },
              isSelected && { color: colors.primary, fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        )}
      </Pressable>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Zona de búsqueda
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar ciudad o zona..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => {
                setSearchQuery('')
                setSearchResults([])
              }}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          <Pressable
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            onPress={handleSearch}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.searchButtonText}>Buscar</Text>
            )}
          </Pressable>
        </View>

        {/* GPS Location Option */}
        {gpsLocation?.latitude && gpsLocation?.longitude && (
          <Pressable
            style={({ pressed }) => [
              styles.gpsOption,
              { 
                backgroundColor: pressed ? colors.muted : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={handleSelectGPS}
          >
            <View style={[styles.gpsIconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="locate" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.gpsTextContainer}>
              <Text style={[styles.gpsTitle, { color: colors.text }]}>
                Usar mi ubicación actual
              </Text>
              <Text style={[styles.gpsSubtitle, { color: colors.textSecondary }]}>
                Buscar sectores cerca de ti
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Resultados de búsqueda
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderLocationItem}
              keyExtractor={(item) => `${item.lat}-${item.lon}`}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Popular Zones */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {searchQuery ? 'Zonas coincidentes' : 'Zonas populares'}
          </Text>
          <FlatList
            data={filteredZones}
            renderItem={renderLocationItem}
            keyExtractor={(item) => `${item.lat}-${item.lon}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No se encontraron zonas
                </Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  gpsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  gpsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTextContainer: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  gpsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
})
