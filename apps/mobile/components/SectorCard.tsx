import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { RelevanceBar } from './RelevanceBar';
import type { SearchSectorResult } from '@/lib/api';

interface SectorCardProps {
  result: SearchSectorResult;
  compact?: boolean;
}

/**
 * Memoized SectorCard component for better performance
 * Only re-renders when sector ID or relevance score changes
 */
export const SectorCard = memo(function SectorCard({ result, compact = false }: SectorCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { sector, relevanceScore, distance, routesInUserRange, matchReasons, conditions } =
    result;

  // Determine gradient colors based on orientation
  const gradientColors = getOrientationGradient(
    sector.sunExposure,
    sector.orientation,
    colorScheme
  );

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const getGradeRange = () => {
    if (!sector.routes || sector.routes.length === 0) return 'N/A';
    const grades = sector.routes
      .map((r: { grade: string | null }) => r.grade)
      .filter(Boolean)
      .sort();
    if (grades.length === 0) return 'N/A';
    return `${grades[0]} - ${grades[grades.length - 1]}`;
  };

  // Get orientation info for display
  const getOrientationInfo = () => {
    const sunExposure = sector.sunExposure?.toLowerCase() || '';
    const orientation = sector.orientation?.toLowerCase() || '';
    
    if (sunExposure.includes('sun') || orientation.includes('s')) {
      return { icon: 'sunny' as const, label: 'Sun', color: '#F59E0B' };
    }
    if (sunExposure.includes('shade') || orientation.includes('n')) {
      return { icon: 'moon' as const, label: 'Shade', color: '#6366F1' };
    }
    return { icon: 'partly-sunny' as const, label: 'Mixed', color: '#64748B' };
  };

  const orientationInfo = getOrientationInfo();

  // Build navigation params with sector data
  const buildNavigationPath = () => {
    const params = new URLSearchParams({
      name: sector.name || '',
      cragName: sector.cragName || '',
      orientation: sector.orientation || '',
      sunExposure: sector.sunExposure || '',
      rockType: sector.rockType || '',
      avgStars: sector.avgStars?.toString() || '',
      totalRoutes: (sector.routes?.length || 0).toString(),
      gradeMin: getGradeRange().split(' - ')[0] || '',
      gradeMax: getGradeRange().split(' - ')[1] || '',
      distance: distance.toString(),
      climbingStyle: Array.isArray(sector.climbingStyle) 
        ? sector.climbingStyle.join(', ') 
        : sector.climbingStyle || '',
    });
    
    // Add coordinates if available
    if (sector.coordinates?.lat) {
      params.set('latitude', sector.coordinates.lat.toString());
    }
    if (sector.coordinates?.lon) {
      params.set('longitude', sector.coordinates.lon.toString());
    }

    // Add tags as individual params (simpler than JSON encoding)
    if (sector.tags) {
      if (sector.tags.kidFriendly !== null && sector.tags.kidFriendly !== undefined) {
        params.set('kidFriendly', sector.tags.kidFriendly.toString());
      }
      if (sector.tags.dogFriendly === true) {
        params.set('dogFriendly', 'true');
      }
      if (sector.tags.beginner === true) {
        params.set('beginner', 'true');
      }
      if (sector.tags.accessible === true) {
        params.set('accessible', 'true');
      }
      if (sector.tags.scenic === true) {
        params.set('scenic', 'true');
      }
      if (sector.tags.camping === true) {
        params.set('camping', 'true');
      }
      if (sector.tags.swimming === true) {
        params.set('swimming', 'true');
      }
      if (sector.tags.quiet === true) {
        params.set('quiet', 'true');
      }
      if (sector.tags.popular === true) {
        params.set('popular', 'true');
      }
      if (sector.tags.sport === true) {
        params.set('sport', 'true');
      }
      if (sector.tags.trad === true) {
        params.set('trad', 'true');
      }
      if (sector.tags.bouldering === true) {
        params.set('bouldering', 'true');
      }
      if (sector.tags.multipitch === true) {
        params.set('multipitch', 'true');
      }
    }
    
    return `/sector/${sector.id}?${params.toString()}`;
  };

  // Compact mode - enhanced layout for grouped display
  if (compact) {
    return (
      <Pressable
        onPress={() => router.push(buildNavigationPath())}
        style={[styles.compactContainer, { backgroundColor: colors.card }]}
      >
        {/* Left: Gradient icon with orientation indicator */}
        <View style={styles.compactLeft}>
          <View style={styles.compactIconWrapper}>
            <LinearGradient
              colors={gradientColors as [string, string, string]}
              style={styles.compactGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="diamond" size={18} color="rgba(255,255,255,0.95)" />
            </LinearGradient>
            {/* Orientation badge */}
            <View style={[styles.orientationBadge, { backgroundColor: orientationInfo.color }]}>
              <Ionicons name={orientationInfo.icon} size={10} color="#FFF" />
            </View>
          </View>
          
          {/* Info section */}
          <View style={styles.compactInfo}>
            <View style={styles.compactTitleRow}>
              <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={1}>
                {sector.name}
              </Text>
              {sector.avgStars && sector.avgStars > 0 && (
                <View style={styles.starsContainer}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.starsText}>{sector.avgStars.toFixed(1)}</Text>
                </View>
              )}
            </View>
            
            {/* Stats row with icons */}
            <View style={styles.compactStatsRow}>
              <View style={styles.compactStatItem}>
                <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                <Text style={[styles.compactStatText, { color: colors.text }]}>
                  {routesInUserRange}
                </Text>
                <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>
                  in range
                </Text>
              </View>
              <View style={[styles.compactStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.compactStatItem}>
                <Ionicons name="list" size={12} color={colors.textSecondary} />
                <Text style={[styles.compactStatText, { color: colors.textSecondary }]}>
                  {sector.routes?.length || 0}
                </Text>
                <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>
                  total
                </Text>
              </View>
              <View style={[styles.compactStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.compactStatItem}>
                <Ionicons name="trending-up" size={12} color={colors.primary} />
                <Text style={[styles.compactStatText, { color: colors.text }]}>
                  {getGradeRange()}
                </Text>
              </View>
            </View>

            {/* Tags row - climbing styles and conditions */}
            <View style={styles.compactTagsRow}>
              {sector.climbingStyle && (
                <View style={[styles.compactTag, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.compactTagText, { color: colors.textSecondary }]}>
                    {Array.isArray(sector.climbingStyle) 
                      ? sector.climbingStyle[0] 
                      : String(sector.climbingStyle).split(',')[0]?.trim()}
                  </Text>
                </View>
              )}
              {sector.rockType && (
                <View style={[styles.compactTag, { backgroundColor: colors.muted }]}>
                  <Ionicons name="diamond-outline" size={10} color={colors.textSecondary} />
                  <Text style={[styles.compactTagText, { color: colors.textSecondary }]}>
                    {sector.rockType}
                  </Text>
                </View>
              )}
              {conditions?.isGoodDay && (
                <View style={[styles.compactTag, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="checkmark-circle" size={10} color="#10B981" />
                  <Text style={[styles.compactTagText, { color: '#10B981' }]}>
                    Good day
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right: Score and arrow */}
        <View style={styles.compactRight}>
          <View style={styles.scoreWrapper}>
            <View style={[styles.compactScore, { backgroundColor: getScoreColor(relevanceScore) }]}>
              <Text style={styles.compactScoreText}>{Math.round(relevanceScore)}</Text>
            </View>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>match</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </Pressable>
    );
  }

  // Full card mode
  return (
    <Pressable
      onPress={() => router.push(buildNavigationPath())}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={gradientColors as [string, string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Ionicons name="diamond" size={32} color="rgba(255,255,255,0.9)" />
          <View style={styles.headerBadge}>
            <Ionicons name="star" size={14} color="#FFF" />
            <Text style={styles.headerBadgeText}>
              {sector.avgStars?.toFixed(1) || 'N/A'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and Routes */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {sector.name}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {routesInUserRange} routes in your range • {sector.routes?.length || 0} total
        </Text>

        {/* Location */}
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {formatDistance(distance)}
          </Text>
          <Text style={[styles.separator, { color: colors.textSecondary }]}>•</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
            {sector.cragName || 'Unknown crag'}
          </Text>
        </View>

        {/* Weather and Conditions */}
        {conditions && (
          <View style={styles.infoRow}>
            <Ionicons name="partly-sunny" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {conditions.isGoodDay ? 'Good day for climbing' : 'Variable conditions'}
            </Text>
          </View>
        )}

        {/* Grade and Rock Type */}
        <View style={styles.infoRow}>
          <Ionicons name="trending-up" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{getGradeRange()}</Text>
          {sector.rockType && (
            <>
              <Text style={[styles.separator, { color: colors.textSecondary }]}>•</Text>
              <Ionicons name="diamond-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {sector.rockType}
              </Text>
            </>
          )}
        </View>

        {/* Climbing Styles */}
        {sector.climbingStyle && sector.climbingStyle.length > 0 && (
          <View style={styles.tagsRow}>
            {(Array.isArray(sector.climbingStyle)
              ? sector.climbingStyle
              : String(sector.climbingStyle).split(',')
            )
              .slice(0, 3)
              .map((style: string, index: number) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    {String(style).trim()}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* Match Reasons */}
        {matchReasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
              {matchReasons[0]}
            </Text>
          </View>
        )}

        {/* Relevance Score */}
        <View style={styles.relevanceContainer}>
          <RelevanceBar score={relevanceScore} label="Relevancia" showPercentage />
        </View>
      </View>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if sector ID or score changes
  return (
    prevProps.result.sector.id === nextProps.result.sector.id &&
    prevProps.result.relevanceScore === nextProps.result.relevanceScore &&
    prevProps.compact === nextProps.compact
  );
});

function getScoreColor(score: number): string {
  if (score >= 75) return '#10B981'; // emerald
  if (score >= 50) return '#F59E0B'; // amber
  if (score >= 25) return '#EF4444'; // red
  return '#64748B'; // slate
}

function getOrientationGradient(
  sunExposure?: string | null,
  orientation?: string | null,
  colorScheme?: 'light' | 'dark'
): [string, string, string] {
  // Sun-facing gradients (warm colors)
  if (
    sunExposure?.toLowerCase().includes('sun') ||
    orientation?.toLowerCase().includes('s')
  ) {
    return colorScheme === 'dark'
      ? ['#F97316', '#FB923C', '#FCD34D']
      : ['#FB923C', '#F59E0B', '#FBBF24'];
  }

  // Shade-facing gradients (cool colors)
  if (
    sunExposure?.toLowerCase().includes('shade') ||
    orientation?.toLowerCase().includes('n')
  ) {
    return colorScheme === 'dark'
      ? ['#475569', '#4F46E5', '#6366F1']
      : ['#64748B', '#6366F1', '#818CF8'];
  }

  // Default/neutral gradient (indigo tones)
  return colorScheme === 'dark'
    ? ['#4338CA', '#4F46E5', '#6366F1']
    : ['#6366F1', '#4F46E5', '#4338CA'];
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Compact mode styles - enhanced design
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  compactIconWrapper: {
    position: 'relative',
  },
  compactGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  orientationBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  compactInfo: {
    flex: 1,
    gap: 4,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  starsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  compactStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactStatText: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactStatLabel: {
    fontSize: 12,
  },
  compactStatDivider: {
    width: 1,
    height: 12,
  },
  compactTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  compactTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compactTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  scoreWrapper: {
    alignItems: 'center',
    gap: 2,
  },
  compactScore: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  compactScoreText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  header: {
    height: 100,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 0,
  },
  separator: {
    fontSize: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reasonsContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  relevanceContainer: {
    marginTop: 8,
  },
});
