import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConditionColors } from '@/constants/Colors';

type ClimbingCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';

interface ConditionBadgeProps {
  condition: ClimbingCondition;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const conditionLabels: Record<ClimbingCondition, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  unsuitable: 'Unsuitable',
};

const conditionIcons: Record<ClimbingCondition, keyof typeof Ionicons.glyphMap> = {
  excellent: 'checkmark-circle',
  good: 'thumbs-up',
  fair: 'remove-circle',
  poor: 'warning',
  unsuitable: 'close-circle',
};

export function ConditionBadge({
  condition,
  size = 'medium',
  showIcon = true,
}: ConditionBadgeProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = ConditionColors[condition][colorScheme];

  const iconSize = size === 'small' ? 14 : size === 'medium' ? 16 : 20;
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 13 : 15;
  const paddingVertical = size === 'small' ? 4 : size === 'medium' ? 6 : 8;
  const paddingHorizontal = size === 'small' ? 8 : size === 'medium' ? 10 : 12;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingVertical,
          paddingHorizontal,
        },
      ]}
    >
      {showIcon && (
        <Ionicons name={conditionIcons[condition]} size={iconSize} color="#FFFFFF" />
      )}
      <Text style={[styles.text, { fontSize }]}>{conditionLabels[condition]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
