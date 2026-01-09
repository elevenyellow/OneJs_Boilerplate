import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
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
      <Skeleton width="100%" height={100} borderRadius={0} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={24} />
        <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
        <Skeleton width="100%" height={16} style={{ marginTop: 12 }} />
        <Skeleton width="100%" height={16} style={{ marginTop: 8 }} />
        <View style={styles.tagsRow}>
          <Skeleton width={80} height={28} borderRadius={14} />
          <Skeleton width={100} height={28} borderRadius={14} />
        </View>
        <Skeleton width="100%" height={8} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});
