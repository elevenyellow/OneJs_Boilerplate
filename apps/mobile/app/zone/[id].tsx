import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useZoneDetail } from '@/hooks/useZones';
import { useWeatherSummary } from '@/hooks/useWeather';
import { useZoneSectors } from '@/hooks/useSectorSearch';
import { WeatherIcon } from '@/components/WeatherIcon';
import { SectorCard } from '@/components/SectorCard';
import { HeroHeader } from '@/components/HeroHeader';

export default function ZoneDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: zone, isLoading, isError, refetch, isRefetching } = useZoneDetail(id || '');
  const { data: weatherSummary, isLoading: isLoadingWeather } = useWeatherSummary(id || '');
  const { data: sectorsData, isLoading: isLoadingSectors } = useZoneSectors(
    zone?.coordinates ?? null,
    { maxDistance: 50, limit: 5 },
    !!zone?.coordinates
  );

  // Get primary climbing type for image selection
  const primaryClimbingType = zone?.climbingTypes?.[0] || null;

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
          {
            label: 'routes',
            value: zone.stats?.totalRoutes || zone.totalRoutes || 0,
            icon: 'git-branch',
          },
          ...(zone.climbingTypes?.length
            ? [{ label: 'styles', value: zone.climbingTypes.length, icon: 'fitness' as const }]
            : []),
        ]}
        badge={
          zone.altitude
            ? { label: `${zone.altitude}m`, icon: 'trending-up' }
            : undefined
        }
      />

      <View style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="git-branch" size={28} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {zone.stats?.totalRoutes || zone.totalRoutes || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Routes</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="trending-up" size={28} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {zone.gradeRange ? `${zone.gradeRange.min}-${zone.gradeRange.max}` : 'N/A'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Grados</Text>
          </View>

          {zone.altitude && (
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="trending-up" size={28} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{zone.altitude}m</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Altitud</Text>
            </View>
          )}

          {zone.climbingTypes && zone.climbingTypes.length > 0 && (
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="fitness" size={28} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {zone.climbingTypes.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Estilos</Text>
            </View>
          )}
        </View>

        {/* Weather Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Clima</Text>
            {weatherSummary?.bestClimbingDay && (
              <View style={[styles.bestDayBadge, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="star" size={12} color="#10B981" />
                <Text style={styles.bestDayText}>
                  Mejor día: {new Date(weatherSummary.bestClimbingDay.date).toLocaleDateString('es-ES', { weekday: 'short' })}
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
                      <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>Hoy</Text>
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
                                {condition.label} para escalar
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

              {/* Next days forecast */}
              {weatherSummary.nextDays && weatherSummary.nextDays.length > 0 && (
                <View style={styles.forecastGrid}>
                  {weatherSummary.nextDays.slice(0, 5).map((day, index) => {
                    const condition = formatClimbingCondition(day.climbingCondition);
                    return (
                      <View key={index} style={styles.forecastDay}>
                        <Text style={[styles.forecastDayName, { color: colors.text }]}>
                          {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                        </Text>
                        <WeatherIcon condition={day.condition} size={28} />
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
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              No hay datos de clima disponibles
            </Text>
          )}
        </View>

        {/* Climbing Types */}
        {zone.climbingTypes && zone.climbingTypes.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tipos de escalada</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mejor época</Text>
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
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Descripción</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {zone.description}
            </Text>
          </View>
        )}

        {/* Approach */}
        {zone.approach && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Aproximación</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {zone.approach}
            </Text>
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
