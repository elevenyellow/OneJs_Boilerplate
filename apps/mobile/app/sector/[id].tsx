import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { WeatherIcon } from '@/components/WeatherIcon';
import { HeroHeader } from '@/components/HeroHeader';
import { useSectorRoutes } from '@/hooks/useSectorRoutes';
import { useWeatherByCoordinates } from '@/hooks/useWeatherByCoordinates';
import type { RouteSearchInfo } from '@/lib/api';
import { gradeToIndex } from '@/utils/gradeConverter';

// Map weather codes to condition strings for WeatherIcon
const getWeatherCondition = (code: number): string => {
  // Meteoblue pictocodes: https://content.meteoblue.com/en/help/standards/symbols-and-pictograms
  if (code === 1) return 'sunny';
  if (code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 4 || code === 5) return 'overcast';
  if (code === 6 || code === 7) return 'foggy';
  if (code === 8 || code === 9) return 'rainy';
  if (code === 10 || code === 11 || code === 12) return 'rainy';
  if (code === 13 || code === 14 || code === 15) return 'snowy';
  if (code === 16 || code === 17) return 'stormy';
  return 'sunny';
};

// Format date to display day name
const formatDayName = (dateStr: string, index: number): string => {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  
  const date = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

export default function SectorDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    cragName?: string;
    orientation?: string;
    sunExposure?: string;
    rockType?: string;
    avgStars?: string;
    totalRoutes?: string;
    routesInRange?: string;
    gradeMin?: string;
    gradeMax?: string;
    distance?: string;
    description?: string;
    approach?: string;
    climbingStyle?: string;
    latitude?: string;
    longitude?: string;
  }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Fetch routes from API
  const { data: routesData, isLoading: isLoadingRoutes } = useSectorRoutes(
    params.id || '',
    undefined,
    !!params.id
  );

  // Parse coordinates
  const latitude = params.latitude ? parseFloat(params.latitude) : null;
  const longitude = params.longitude ? parseFloat(params.longitude) : null;

  // Fetch weather data by coordinates
  const { data: weatherData, isLoading: isLoadingWeather } = useWeatherByCoordinates(
    latitude,
    longitude,
    latitude !== null && longitude !== null
  );

  // Use passed params or fallback to mock data
  const sector = {
    id: params.id,
    name: params.name || 'Sector',
    cragName: params.cragName || '',
    orientation: params.orientation || '',
    sunExposure: params.sunExposure || '',
    rockType: params.rockType || '',
    avgStars: params.avgStars ? parseFloat(params.avgStars) : null,
    totalRoutes: routesData?.total || (params.totalRoutes ? parseInt(params.totalRoutes, 10) : 0),
    routesInRange: params.routesInRange ? parseInt(params.routesInRange, 10) : null,
    gradeRange: { min: params.gradeMin || '', max: params.gradeMax || '' },
    distance: params.distance ? parseFloat(params.distance) : null,
    description: params.description || null,
    approach: params.approach || null,
    climbingStyle: params.climbingStyle || '',
    latitude: params.latitude ? parseFloat(params.latitude) : null,
    longitude: params.longitude ? parseFloat(params.longitude) : null,
  };

  const allRoutes = routesData?.routes || [];

  // Calculate grade indices for filtering
  const userMinGradeIndex = sector.gradeRange.min ? gradeToIndex(sector.gradeRange.min) : null;
  const userMaxGradeIndex = sector.gradeRange.max ? gradeToIndex(sector.gradeRange.max) : null;

  // Separate routes into "in range" and "all others"
  const { routesInRange, routesOutOfRange } = allRoutes.reduce<{
    routesInRange: RouteSearchInfo[];
    routesOutOfRange: RouteSearchInfo[];
  }>(
    (acc, route) => {
      // If no user range is set, all routes go to "out of range" (show all)
      if (userMinGradeIndex === null || userMaxGradeIndex === null) {
        acc.routesOutOfRange.push(route);
        return acc;
      }

      // Use gradeIndex from API if available, otherwise calculate from grade string
      const routeGradeIndex = route.gradeIndex ?? (route.grade ? gradeToIndex(route.grade) : null);

      if (
        routeGradeIndex !== null &&
        routeGradeIndex >= userMinGradeIndex &&
        routeGradeIndex <= userMaxGradeIndex
      ) {
        acc.routesInRange.push(route);
      } else {
        acc.routesOutOfRange.push(route);
      }

      return acc;
    },
    { routesInRange: [], routesOutOfRange: [] }
  );

  const handleOpenTheCrag = () => {
    // TODO: Open actual TheCrag URL
    Linking.openURL('https://www.thecrag.com');
  };

  const handleViewOnMap = () => {
    router.push('/');
  };

  const handleGetDirections = () => {
    if (sector.latitude === null || sector.longitude === null) {
      Alert.alert(
        'Location unavailable',
        'Coordinates not found for this sector.'
      );
      return;
    }

    const lat = sector.latitude;
    const lon = sector.longitude;
    const label = encodeURIComponent(sector.name);

    // Create URLs for different map apps
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    const appleMapsUrl = `maps://app?daddr=${lat},${lon}&q=${label}`;

    if (Platform.OS === 'ios') {
      // On iOS, try Apple Maps first, then fallback to Google Maps
      Linking.canOpenURL(appleMapsUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(appleMapsUrl);
          } else {
            return Linking.openURL(googleMapsUrl);
          }
        })
        .catch(() => Linking.openURL(googleMapsUrl));
    } else {
      // On Android, open Google Maps directly
      Linking.openURL(googleMapsUrl);
    }
  };

  // Render star rating
  const renderStars = (stars: number | null) => {
    if (stars === null || stars === 0 || Number.isNaN(stars) || stars < 0) return null;
    const fullStars = Math.max(0, Math.min(5, Math.floor(stars)));
    const hasHalf = stars - fullStars >= 0.5;
    
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: fullStars }, (_, i) => (
          <Ionicons key={i} name="star" size={12} color="#F59E0B" />
        ))}
        {hasHalf && <Ionicons name="star-half" size={12} color="#F59E0B" />}
      </View>
    );
  };

  // Get grade color based on difficulty
  const getGradeColor = (grade: string | null): string => {
    if (!grade) return colors.textSecondary;
    const gradeNum = parseInt(grade.replace(/[^\d]/g, ''), 10);
    if (gradeNum <= 5) return '#22C55E'; // green - easy
    if (gradeNum <= 6) return '#F59E0B'; // amber - medium
    if (gradeNum <= 7) return '#EF4444'; // red - hard
    return '#7C3AED'; // purple - very hard
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero Header with Image */}
      <HeroHeader
        title={sector.name}
        subtitle={sector.cragName || undefined}
        rockType={sector.rockType}
        climbingType={sector.climbingStyle}
        icon="diamond"
        onBack={() => router.back()}
        stats={[
          { label: 'routes', value: sector.totalRoutes, icon: 'git-branch' },
          ...(sector.routesInRange !== null
            ? [{ label: 'in range', value: sector.routesInRange, icon: 'checkmark-circle' as const }]
            : []),
          ...(sector.distance !== null
            ? [{
                label: 'km',
                value: sector.distance < 1
                  ? `${Math.round(sector.distance * 1000)}m`
                  : sector.distance.toFixed(1),
                icon: 'location' as const,
              }]
            : []),
        ]}
        badge={
          sector.avgStars !== null && sector.avgStars > 0
            ? { label: `${sector.avgStars.toFixed(1)} ★`, color: '#F59E0B' }
            : undefined
        }
      />

      <View style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="git-branch" size={28} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{sector.totalRoutes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total routes</Text>
          </View>

          {sector.routesInRange !== null && (
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
              <Text style={[styles.statValue, { color: colors.text }]}>{sector.routesInRange}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In your range</Text>
            </View>
          )}

          {sector.gradeRange.min && sector.gradeRange.max && (
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="trending-up" size={28} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {sector.gradeRange.min}-{sector.gradeRange.max}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Grades</Text>
            </View>
          )}

          {sector.distance !== null && (
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="location" size={28} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {sector.distance < 1 
                  ? `${Math.round(sector.distance * 1000)}m` 
                  : `${sector.distance.toFixed(1)}km`}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Distance</Text>
            </View>
          )}

          {sector.avgStars !== null && sector.avgStars > 0 && (
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="star" size={28} color="#FFB800" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {sector.avgStars.toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Quality</Text>
            </View>
          )}
        </View>

        {/* Sector Info */}
        {(sector.rockType || sector.orientation || sector.sunExposure || sector.climbingStyle) && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Information</Text>

            {sector.rockType && (
              <View style={styles.infoRow}>
                <Ionicons name="diamond-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Rock type:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{sector.rockType}</Text>
              </View>
            )}

            {sector.orientation && (
              <View style={styles.infoRow}>
                <Ionicons name="compass" size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Orientation:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{sector.orientation}</Text>
              </View>
            )}

            {sector.sunExposure && (
              <View style={styles.infoRow}>
                <Ionicons name="sunny" size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Exposure:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{sector.sunExposure}</Text>
              </View>
            )}

            {sector.climbingStyle && (
              <View style={styles.infoRow}>
                <Ionicons name="hand-left" size={20} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Style:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{sector.climbingStyle}</Text>
              </View>
            )}
          </View>
        )}

        {/* Routes In Range Section */}
        {routesInRange.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.routesHeader}>
              <View style={styles.routesTitleRow}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>
                  In your range ({routesInRange.length})
                </Text>
              </View>
              {isLoadingRoutes && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
            <Text style={[styles.rangeSubtitle, { color: colors.textSecondary }]}>
              {sector.gradeRange.min} - {sector.gradeRange.max}
            </Text>

            {routesInRange.map((route: RouteSearchInfo, index: number) => (
              <View
                key={route.id || `route-in-range-${index}`}
                style={[
                  styles.routeItem,
                  index < routesInRange.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.routeLeft}>
                  <View style={styles.routeNameRow}>
                    <Text style={[styles.routeName, { color: colors.text }]} numberOfLines={1}>
                      {route.name}
                    </Text>
                    {renderStars(route.stars)}
                  </View>
                  <View style={styles.routeMeta}>
                    {route.height && (
                      <Text style={[styles.routeMetaText, { color: colors.textSecondary }]}>
                        {route.height}m
                      </Text>
                    )}
                    {route.pitches && route.pitches > 1 && (
                      <Text style={[styles.routeMetaText, { color: colors.textSecondary }]}>
                        • {route.pitches} largos
                      </Text>
                    )}
                    {route.bolts && route.bolts > 0 && (
                      <Text style={[styles.routeMetaText, { color: colors.textSecondary }]}>
                        • {route.bolts} chapas
                      </Text>
                    )}
                    {route.ascents && route.ascents > 0 && (
                      <Text style={[styles.routeMetaText, { color: colors.textSecondary }]}>
                        • {route.ascents} ascensos
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.routeRight}>
                  {route.grade && (
                    <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(route.grade) + '20' }]}>
                      <Text style={[styles.gradeText, { color: getGradeColor(route.grade) }]}>
                        {route.grade}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* All Routes Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.routesHeader}>
            <View style={styles.routesTitleRow}>
              <Ionicons name="list" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>
                {routesInRange.length > 0 ? `Other routes (${routesOutOfRange.length})` : `All routes (${allRoutes.length})`}
              </Text>
            </View>
            {isLoadingRoutes && routesInRange.length === 0 && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {allRoutes.length === 0 && !isLoadingRoutes && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No routes found for this sector
            </Text>
          )}

          {(routesInRange.length > 0 ? routesOutOfRange : allRoutes).map((route: RouteSearchInfo, index: number) => {
            const routeList = routesInRange.length > 0 ? routesOutOfRange : allRoutes;
            return (
              <View
                key={route.id || `route-${index}`}
                style={[
                  styles.routeItem,
                  index < routeList.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.routeLeft}>
                  <View style={styles.routeNameRow}>
                    <Text style={[styles.routeName, { color: colors.text }]} numberOfLines={1}>
                      {route.name}
                    </Text>
                    {renderStars(route.stars)}
                  </View>
                  <View style={styles.routeMeta}>
                    {route.height && (
                      <Text style={[styles.routeMetaText, { color: colors.textSecondary }]}>
                        {route.height}m
                      </Text>
                    )}
                    {route.pitches && route.pitches > 1 && (
                      <Text style={[styles.routeMetaText, { color: colors.textSecondary }]}>
                        • {route.pitches} pitches
                      </Text>
                    )}
                    {route.bolts && route.bolts > 0 && (
                      <Text style={[styles.routeMetaText, { color: colors.textSecondary }]}>
                        • {route.bolts} bolts
                      </Text>
                    )}
                    {route.ascents && route.ascents > 0 && (
                      <Text style={[styles.routeMetaText, { color: colors.textSecondary }]}>
                        • {route.ascents} ascents
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.routeRight}>
                  {route.grade && (
                    <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(route.grade) + '20' }]}>
                      <Text style={[styles.gradeText, { color: getGradeColor(route.grade) }]}>
                        {route.grade}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Weather Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.weatherHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Weather</Text>
            {isLoadingWeather && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
          {weatherData?.daily && weatherData.daily.length > 0 ? (
            <View style={styles.weatherGrid}>
              {weatherData.daily.slice(0, 5).map((day, index) => (
                <View key={day.date} style={styles.weatherCard}>
                  <Text style={[styles.weatherDay, { color: colors.text }]}>
                    {formatDayName(day.date, index)}
                  </Text>
                  <WeatherIcon condition={getWeatherCondition(day.weatherCode)} size={32} />
                  <Text style={[styles.weatherTemp, { color: colors.text }]}>
                    {Math.round(day.temperature.max)}°
                  </Text>
                  <Text style={[styles.weatherTempMin, { color: colors.textSecondary }]}>
                    {Math.round(day.temperature.min)}°
                  </Text>
                  {day.precipitation.probability > 20 && (
                    <View style={styles.precipBadge}>
                      <Ionicons name="water" size={10} color="#3B82F6" />
                      <Text style={styles.precipText}>{day.precipitation.probability}%</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : !isLoadingWeather && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {latitude === null || longitude === null 
                ? 'Location data not available for weather'
                : 'Weather data not available'}
            </Text>
          )}
        </View>

        {/* Description */}
        {sector.description && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {sector.description}
            </Text>
          </View>
        )}

        {/* Approach */}
        {sector.approach && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Approach</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {sector.approach}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Directions Button - Primary action */}
          <Pressable
            style={[
              styles.actionButton,
              styles.directionsButton,
              { backgroundColor: '#10B981' },
            ]}
            onPress={handleGetDirections}
          >
            <Ionicons name="navigate" size={22} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
              Get directions
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenTheCrag}
          >
            <Ionicons name="open-outline" size={20} color={colors.primaryForeground} />
            <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>
              View on TheCrag
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={handleViewOnMap}
          >
            <Ionicons name="map" size={20} color={colors.secondaryForeground} />
            <Text style={[styles.actionButtonText, { color: colors.secondaryForeground }]}>
              View on map
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  cragName: {
    fontSize: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  // Routes list styles
  routesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 28,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  routeLeft: {
    flex: 1,
    marginRight: 12,
  },
  routeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  routeMetaText: {
    fontSize: 12,
  },
  routeRight: {
    alignItems: 'flex-end',
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 48,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Weather styles
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weatherGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  weatherCard: {
    alignItems: 'center',
    gap: 4,
    minWidth: 56,
    paddingVertical: 8,
  },
  weatherDay: {
    fontSize: 12,
    fontWeight: '600',
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: '700',
  },
  weatherTempMin: {
    fontSize: 12,
  },
  precipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  precipText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  directionsButton: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
