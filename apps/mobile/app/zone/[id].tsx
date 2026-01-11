import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useZoneDetail } from '@/hooks/useZones';
import { useWeatherSummary } from '@/hooks/useWeather';
import { useWeatherByCoordinates } from '@/hooks/useWeatherByCoordinates';
import { useZoneSectors } from '@/hooks/useSectorSearch';
import { WeatherIcon } from '@/components/WeatherIcon';
import { SectorCard } from '@/components/SectorCard';
import { HeroHeader } from '@/components/HeroHeader';
import { LanguageTextSection } from '@/components/LanguageTextSection';
import { GradeRangeBadge } from '@/components/GradeRangeBadge';
import { useGradeRange } from '@/contexts/FiltersContext';
import { t } from '@/lib/i18n';

export default function ZoneDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Get global grade range from context
  const { gradeRange: globalGradeRange } = useGradeRange();

  const { data: zone, isLoading, isError, refetch, isRefetching } = useZoneDetail(id || '');
  const { data: weatherSummary, isLoading: isLoadingWeatherSummary } = useWeatherSummary(id || '');
  
  // Fallback to coordinates-based weather when summary is not available
  const { data: weatherByCoords, isLoading: isLoadingWeatherCoords } = useWeatherByCoordinates(
    zone?.coordinates?.latitude ?? null,
    zone?.coordinates?.longitude ?? null,
    !!zone?.coordinates && !weatherSummary
  );
  
  const isLoadingWeather = isLoadingWeatherSummary || isLoadingWeatherCoords;
  
  const { data: sectorsData, isLoading: isLoadingSectors } = useZoneSectors(
    zone?.coordinates ?? null,
    { maxDistance: 50, limit: 10, gradeRange: globalGradeRange },
    !!zone?.coordinates
  );

  // Get primary climbing type for image selection
  const primaryClimbingType = zone?.climbingTypes?.[0] || null;

  // Calculate total sectors and routes in range
  const totalSectors = useMemo(() => {
    return sectorsData?.totalSectors ?? 0;
  }, [sectorsData]);

  const totalRoutesInRange = useMemo(() => {
    return sectorsData?.totalRoutesInRange ?? 0;
  }, [sectorsData]);

  const handleOpenTheCrag = () => {
    if (zone?.theCragUrl) {
      Linking.openURL(zone.theCragUrl);
    } else {
      Linking.openURL('https://www.thecrag.com');
    }
  };

  const handleViewOnMap = () => {
    if (zone?.coordinates) {
      router.push({
        pathname: '/',
        params: {
          lat: zone.coordinates.latitude.toString(),
          lng: zone.coordinates.longitude.toString(),
        },
      });
    } else {
      router.push('/');
    }
  };

  const handleGetDirections = () => {
    if (!zone?.coordinates) {
      Alert.alert(
        'Location unavailable',
        'Coordinates not found for this zone.',
      );
      return;
    }

    const lat = zone.coordinates.latitude;
    const lon = zone.coordinates.longitude;
    const label = encodeURIComponent(zone.name);

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

  const formatClimbingCondition = (condition?: string) => {
    const conditionMap: Record<string, { label: string; color: string; icon: string }> = {
      excellent: { label: 'Excellent', color: '#10B981', icon: 'checkmark-circle' },
      good: { label: 'Good', color: '#22C55E', icon: 'thumbs-up' },
      fair: { label: 'Fair', color: '#F59E0B', icon: 'remove-circle' },
      poor: { label: 'Poor', color: '#EF4444', icon: 'warning' },
      unsuitable: { label: 'Unsuitable', color: '#DC2626', icon: 'close-circle' },
    };
    return conditionMap[condition || ''] || { label: 'Unknown', color: colors.textSecondary, icon: 'help-circle' };
  };

  // Convert weather code to condition string for WeatherIcon
  const getWeatherCondition = (code: number): string => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code === 0) return 'clear';
    if (code === 1 || code === 2) return 'partly-cloudy';
    if (code === 3) return 'cloudy';
    if (code >= 45 && code <= 48) return 'fog';
    if (code >= 51 && code <= 55) return 'drizzle';
    if (code >= 56 && code <= 57) return 'freezing-drizzle';
    if (code >= 61 && code <= 65) return 'rain';
    if (code >= 66 && code <= 67) return 'freezing-rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain-showers';
    if (code >= 85 && code <= 86) return 'snow-showers';
    if (code >= 95 && code <= 99) return 'thunderstorm';
    return 'unknown';
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading zone...
        </Text>
      </View>
    );
  }

  if (isError || !zone) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={64} color={colors.destructive} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Error loading zone
        </Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
          Could not get information for this zone
        </Text>
        <Pressable
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={[styles.retryButtonText, { color: colors.primaryForeground }]}>
            Retry
          </Text>
        </Pressable>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={[styles.backLinkText, { color: colors.primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
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
        title={zone.name}
        subtitle={`${zone.region}, ${zone.country}`}
        imageUrl={zone.imageUrl}
        theCragUrl={zone.theCragUrl}
        climbingType={primaryClimbingType}
        icon="globe"
        onBack={() => router.back()}
        stats={[
          ...(totalSectors > 0
            ? [{ label: 'sectors', value: totalSectors, icon: 'grid' as const }]
            : []),
          {
            label: 'routes',
            value: zone.stats?.totalRoutes || zone.totalRoutes || 0,
            icon: 'git-branch',
          },
          ...(totalRoutesInRange > 0
            ? [{ label: 'in range', value: totalRoutesInRange, icon: 'checkmark-circle' as const }]
            : []),
        ]}
        badge={
          zone.altitude
            ? { label: `${zone.altitude}m`, icon: 'trending-up' }
            : undefined
        }
      />

      <View style={styles.content}>
        {/* Grade Range Badge - Tappable to change */}
        <GradeRangeBadge style={styles.gradeRangeBadge} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Sectors */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="grid" size={28} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalSectors || sectorsData?.results?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('sectors')}</Text>
          </View>

          {/* Total Routes */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="git-branch" size={28} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {zone.stats?.totalRoutes || zone.totalRoutes || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('routes')}</Text>
          </View>

          {/* Routes in Range - Highlighted */}
          <View style={[styles.statCard, styles.statCardHighlight, { backgroundColor: '#22C55E15', borderColor: '#22C55E' }]}>
            <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
            <Text style={[styles.statValue, { color: '#22C55E' }]}>
              {totalRoutesInRange}
            </Text>
            <Text style={[styles.statLabel, { color: '#22C55E' }]}>{t('inRange')}</Text>
          </View>

          {/* Directions Quick Access */}
          {zone.coordinates && (
            <Pressable 
              style={[styles.statCard, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
              onPress={handleGetDirections}
            >
              <Ionicons name="navigate" size={28} color="#FFFFFF" />
              <Text style={[styles.statValue, { color: '#FFFFFF', fontSize: 14 }]}>
                {t('go')}
              </Text>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.9)' }]}>{t('directions')}</Text>
            </Pressable>
          )}
        </View>

        {/* Second row: Grades and Altitude */}
        <View style={styles.statsGridSecondary}>
          <View style={[styles.statCardSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="trending-up" size={20} color={colors.primary} />
            <Text style={[styles.statValueSmall, { color: colors.text }]}>
              {zone.gradeRange ? `${zone.gradeRange.min} - ${zone.gradeRange.max}` : 'N/A'}
            </Text>
            <Text style={[styles.statLabelSmall, { color: colors.textSecondary }]}>{t('gradeRange')}</Text>
          </View>

          {zone.altitude && (
            <View style={[styles.statCardSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <Text style={[styles.statValueSmall, { color: colors.text }]}>{zone.altitude}m</Text>
              <Text style={[styles.statLabelSmall, { color: colors.textSecondary }]}>{t('altitude')}</Text>
            </View>
          )}

          {zone.climbingTypes && zone.climbingTypes.length > 0 && (
            <View style={[styles.statCardSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="fitness" size={20} color={colors.primary} />
              <Text style={[styles.statValueSmall, { color: colors.text }]}>
                {zone.climbingTypes.length}
              </Text>
              <Text style={[styles.statLabelSmall, { color: colors.textSecondary }]}>{t('styles')}</Text>
            </View>
          )}
        </View>

        {/* Weather Section - Weekly Forecast */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="partly-sunny" size={24} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>
                {t('weather')}
              </Text>
            </View>
            {weatherSummary?.bestClimbingDay && (
              <View style={[styles.bestDayBadge, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="star" size={12} color="#10B981" />
                <Text style={styles.bestDayText}>
                  {t('bestDay')}: {new Date(weatherSummary.bestClimbingDay.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
              </View>
            )}
          </View>

          {isLoadingWeather ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : weatherSummary ? (
            <View style={styles.weatherContent}>
              {/* Today's weather */}
              {weatherSummary.today && (
                <View style={[styles.todayWeather, { backgroundColor: colors.muted }]}>
                  <View style={styles.todayWeatherMain}>
                    <WeatherIcon condition={weatherSummary.today.condition} size={48} />
                    <View style={styles.todayWeatherInfo}>
                      <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>{t('today')}</Text>
                      <Text style={[styles.todayTemp, { color: colors.text }]}>
                        {weatherSummary.today.tempMin}° - {weatherSummary.today.tempMax}°
                      </Text>
                      <View style={styles.conditionRow}>
                        {(() => {
                          const condition = formatClimbingCondition(weatherSummary.today.climbingCondition);
                          return (
                            <>
                              <Ionicons name={condition.icon as keyof typeof Ionicons.glyphMap} size={14} color={condition.color} />
                              <Text style={[styles.conditionText, { color: condition.color }]}>
                                {condition.label} for climbing
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                    </View>
                  </View>
                  <View style={styles.todayWeatherDetails}>
                    <View style={styles.weatherDetailItem}>
                      <Ionicons name="water" size={16} color={colors.textSecondary} />
                      <Text style={[styles.weatherDetailText, { color: colors.textSecondary }]}>
                        {weatherSummary.today.humidity}%
                      </Text>
                    </View>
                    <View style={styles.weatherDetailItem}>
                      <Ionicons name="rainy" size={16} color={colors.textSecondary} />
                      <Text style={[styles.weatherDetailText, { color: colors.textSecondary }]}>
                        {weatherSummary.today.precipitationProbability}%
                      </Text>
                    </View>
                    <View style={styles.weatherDetailItem}>
                      <Ionicons name="speedometer" size={16} color={colors.textSecondary} />
                      <Text style={[styles.weatherDetailText, { color: colors.textSecondary }]}>
                        {weatherSummary.today.windSpeed} km/h
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Weekly forecast - 7 days */}
              {weatherSummary.nextDays && weatherSummary.nextDays.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.forecastScrollContent}
                >
                  {weatherSummary.nextDays.slice(0, 7).map((day, index) => {
                    const condition = formatClimbingCondition(day.climbingCondition);
                    return (
                      <View key={index} style={[styles.forecastDayCard, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.forecastDayName, { color: colors.text }]}>
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.forecastDayDate, { color: colors.textSecondary }]}>
                          {new Date(day.date).getDate()}
                        </Text>
                        <WeatherIcon condition={day.condition} size={32} />
                        <Text style={[styles.forecastTemp, { color: colors.text }]}>
                          {day.tempMax}°
                        </Text>
                        <Text style={[styles.forecastTempMin, { color: colors.textSecondary }]}>
                          {day.tempMin}°
                        </Text>
                        <View style={[styles.forecastConditionDot, { backgroundColor: condition.color }]} />
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : weatherByCoords ? (
            // Fallback: Use coordinates-based weather data
            <View style={styles.weatherContent}>
              {/* Today from coordinates weather */}
              {weatherByCoords.daily && weatherByCoords.daily.length > 0 && (
                <>
                  <View style={[styles.todayWeather, { backgroundColor: colors.muted }]}>
                    <View style={styles.todayWeatherMain}>
                      <WeatherIcon condition={getWeatherCondition(weatherByCoords.daily[0].weatherCode)} size={48} />
                      <View style={styles.todayWeatherInfo}>
                        <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>{t('today')}</Text>
                        <Text style={[styles.todayTemp, { color: colors.text }]}>
                          {Math.round(weatherByCoords.daily[0].temperature.min)}° - {Math.round(weatherByCoords.daily[0].temperature.max)}°
                        </Text>
                      </View>
                    </View>
                    <View style={styles.todayWeatherDetails}>
                      <View style={styles.weatherDetailItem}>
                        <Ionicons name="water" size={16} color={colors.textSecondary} />
                        <Text style={[styles.weatherDetailText, { color: colors.textSecondary }]}>
                          {Math.round(weatherByCoords.daily[0].humidity.mean)}%
                        </Text>
                      </View>
                      <View style={styles.weatherDetailItem}>
                        <Ionicons name="rainy" size={16} color={colors.textSecondary} />
                        <Text style={[styles.weatherDetailText, { color: colors.textSecondary }]}>
                          {weatherByCoords.daily[0].precipitation.probability}%
                        </Text>
                      </View>
                      <View style={styles.weatherDetailItem}>
                        <Ionicons name="speedometer" size={16} color={colors.textSecondary} />
                        <Text style={[styles.weatherDetailText, { color: colors.textSecondary }]}>
                          {Math.round(weatherByCoords.daily[0].wind.mean)} km/h
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Weekly forecast from coordinates - 7 days */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.forecastScrollContent}
                  >
                    {weatherByCoords.daily.slice(1, 8).map((day, index) => (
                      <View key={index} style={[styles.forecastDayCard, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.forecastDayName, { color: colors.text }]}>
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.forecastDayDate, { color: colors.textSecondary }]}>
                          {new Date(day.date).getDate()}
                        </Text>
                        <WeatherIcon condition={getWeatherCondition(day.weatherCode)} size={32} />
                        <Text style={[styles.forecastTemp, { color: colors.text }]}>
                          {Math.round(day.temperature.max)}°
                        </Text>
                        <Text style={[styles.forecastTempMin, { color: colors.textSecondary }]}>
                          {Math.round(day.temperature.min)}°
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          ) : (
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              No weather data available
            </Text>
          )}
        </View>

        {/* Climbing Types */}
        {zone.climbingTypes && zone.climbingTypes.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Climbing types</Text>
            <View style={styles.typesRow}>
              {zone.climbingTypes.map((type, index) => (
                <View
                  key={index}
                  style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[styles.typeText, { color: colors.primary }]}>{type}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Best Seasons */}
        {zone.bestSeasons && zone.bestSeasons.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Best season</Text>
            <View style={styles.typesRow}>
              {zone.bestSeasons.map((season, index) => (
                <View
                  key={index}
                  style={[styles.seasonBadge, { backgroundColor: '#FEF3C7' }]}
                >
                  <Ionicons name="sunny" size={14} color="#F59E0B" />
                  <Text style={[styles.seasonText, { color: '#D97706' }]}>{season}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {zone.description && (
          <LanguageTextSection
            text={zone.description}
            title={t('description')}
          />
        )}

        {/* How to Get There / Approach Section */}
        {(zone.approach || zone.coordinates) && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="navigate-circle" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>
                  {t('howToGetThere')}
                </Text>
              </View>
            </View>

            {/* Quick Directions Button */}
            {zone.coordinates && (
              <Pressable 
                style={[styles.directionsButton, { backgroundColor: '#10B981' }]}
                onPress={handleGetDirections}
              >
                <Ionicons name="navigate" size={24} color="#FFFFFF" />
                <View style={styles.directionsTextContainer}>
                  <Text style={styles.directionsButtonTitle}>{t('getDirections')}</Text>
                  <Text style={styles.directionsButtonSubtitle}>
                    {t('openInMaps')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </Pressable>
            )}

            {/* Approach Description */}
            {zone.approach && (
              <View style={styles.approachTextContainer}>
                <LanguageTextSection
                  text={zone.approach}
                  title=""
                  showMapButton={false}
                />
              </View>
            )}
          </View>
        )}

        {/* Routes by Type */}
        {zone.stats?.routesByType && Object.keys(zone.stats.routesByType).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Routes by type</Text>
            {Object.entries(zone.stats.routesByType).map(([type, count]) => (
              <View key={type} style={styles.routeTypeRow}>
                <Text style={[styles.routeTypeLabel, { color: colors.text }]}>{type}</Text>
                <View style={styles.routeTypeBarContainer}>
                  <View
                    style={[
                      styles.routeTypeBar,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.min((count / zone.stats.totalRoutes) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.routeTypeCount, { color: colors.textSecondary }]}>
                  {count}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommended Sectors */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Recommended sectors
            </Text>
            {sectorsData?.totalSectors && (
              <Text style={[styles.sectorCount, { color: colors.textSecondary }]}>
                {sectorsData.totalSectors} sectors
              </Text>
            )}
          </View>

          {isLoadingSectors ? (
            <View style={styles.sectorsLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Searching sectors...
              </Text>
            </View>
          ) : sectorsData?.results && sectorsData.results.length > 0 ? (
            <View style={styles.sectorsList}>
              {sectorsData.results.slice(0, 3).flatMap((cragGroup) =>
                cragGroup.sectors.slice(0, 2).map((sectorResult) => (
                  <SectorCard
                    key={sectorResult.sector.id}
                    result={sectorResult}
                    compact
                  />
                ))
              )}
              
              {sectorsData.totalSectors > 5 && (
                <Pressable
                  style={[styles.viewAllButton, { backgroundColor: colors.muted }]}
                  onPress={() => {
                    // Navigate to sectors search with zone location pre-filled
                    if (zone?.coordinates) {
                      router.push({
                        pathname: '/',
                        params: {
                          tab: 'search',
                          lat: zone.coordinates.latitude.toString(),
                          lng: zone.coordinates.longitude.toString(),
                        },
                      });
                    }
                  }}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>
                    View all sectors
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.noSectorsContainer}>
              <Ionicons name="diamond-outline" size={32} color={colors.textSecondary} />
              <Text style={[styles.noSectorsText, { color: colors.textSecondary }]}>
                No nearby sectors found
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
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
  location: {
    fontSize: 18,
  },
  gradeRangeBadge: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statsGridSecondary: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  statCardHighlight: {
    borderWidth: 2,
  },
  statCardSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  statLabelSmall: {
    fontSize: 11,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  directionsTextContainer: {
    flex: 1,
  },
  directionsButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  directionsButtonSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  approachTextContainer: {
    marginTop: 4,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  bestDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  weatherContent: {
    gap: 16,
  },
  todayWeather: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  todayWeatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  todayWeatherInfo: {
    flex: 1,
  },
  todayLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  todayTemp: {
    fontSize: 24,
    fontWeight: '700',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  todayWeatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherDetailText: {
    fontSize: 13,
  },
  forecastGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastScrollContent: {
    paddingVertical: 4,
    gap: 10,
  },
  forecastDayCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 4,
    minWidth: 70,
  },
  forecastDay: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  forecastDayName: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  forecastDayDate: {
    fontSize: 10,
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: '700',
  },
  forecastTempMin: {
    fontSize: 12,
  },
  forecastConditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  seasonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  routeTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  routeTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 100,
  },
  routeTypeBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  routeTypeBar: {
    height: '100%',
    borderRadius: 4,
  },
  routeTypeCount: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  sectorCount: {
    fontSize: 14,
  },
  sectorsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  sectorsList: {
    gap: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noSectorsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  noSectorsText: {
    fontSize: 14,
    textAlign: 'center',
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
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
