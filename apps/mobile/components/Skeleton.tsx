import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 12, style }: SkeletonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.7, 0.4],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SectorCardSkeleton() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Left gradient bar */}
      <View style={[styles.leftBar, { backgroundColor: colors.muted }]} />
      
      <View style={styles.cardContent}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Skeleton width={44} height={44} borderRadius={14} />
            <View style={styles.headerInfo}>
              <Skeleton width="80%" height={20} />
              <Skeleton width="50%" height={14} style={{ marginTop: 6 }} />
            </View>
          </View>
          <Skeleton width={48} height={48} borderRadius={12} />
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.muted }]}>
          <View style={styles.statItem}>
            <Skeleton width={30} height={30} borderRadius={10} />
            <View style={styles.statContent}>
              <Skeleton width={40} height={16} />
              <Skeleton width={50} height={10} style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Skeleton width={30} height={30} borderRadius={10} />
            <View style={styles.statContent}>
              <Skeleton width={30} height={16} />
              <Skeleton width={50} height={10} style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Skeleton width={30} height={30} borderRadius={10} />
            <View style={styles.statContent}>
              <Skeleton width={20} height={16} />
              <Skeleton width={40} height={10} style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <View style={styles.badgesRow}>
            <Skeleton width={60} height={28} borderRadius={10} />
            <Skeleton width={50} height={28} borderRadius={10} />
          </View>
          <Skeleton width={60} height={36} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

export function ZoneCardSkeleton() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.zoneCardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Image placeholder */}
      <Skeleton width="100%" height={160} borderRadius={0} />
      
      <View style={styles.zoneCardContent}>
        <Skeleton width="70%" height={22} />
        <View style={styles.zoneLocationRow}>
          <Skeleton width={14} height={14} borderRadius={7} />
          <Skeleton width="50%" height={14} />
        </View>
        <View style={styles.zoneStatsRow}>
          <Skeleton width={100} height={16} />
        </View>
        <View style={styles.zoneTypesRow}>
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={50} height={24} borderRadius={12} />
          <Skeleton width={70} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

export function WeatherSkeleton() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.weatherContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.weatherLeft}>
        <Skeleton width={48} height={48} borderRadius={14} />
        <View>
          <Skeleton width={60} height={22} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton width={90} height={36} borderRadius={20} />
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SectorCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  cardContainer: {
    flexDirection: 'row',
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    overflow: 'hidden',
    marginBottom: 0,
  },
  leftBar: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  zoneCardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  zoneCardContent: {
    padding: 16,
    gap: 8,
  },
  zoneLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoneStatsRow: {
    marginTop: 4,
  },
  zoneTypesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listContainer: {
    paddingHorizontal: 0,
  },
});
