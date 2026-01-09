import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface RelevanceBarProps {
  score: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}

export function RelevanceBar({ score, label, showPercentage = true }: RelevanceBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const clampedScore = Math.max(0, Math.min(100, score));
  const barColor = getBarColor(clampedScore, colors);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {showPercentage && (
            <Text style={[styles.percentage, { color: colors.primary }]}>
              {Math.round(clampedScore)}%
            </Text>
          )}
        </View>
      )}
      <View style={[styles.barBackground, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.barFill,
            {
              backgroundColor: barColor,
              width: `${clampedScore}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function getBarColor(score: number, colors: any): string {
  if (score >= 80) return '#10B981'; // Emerald - Excellent
  if (score >= 60) return '#22C55E'; // Green - Good
  if (score >= 40) return '#F59E0B'; // Amber - Fair
  if (score >= 20) return '#F97316'; // Orange - Poor
  return '#EF4444'; // Red - Low
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
