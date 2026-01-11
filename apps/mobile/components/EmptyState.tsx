import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: React.ReactNode;
  variant?: 'default' | 'error' | 'search' | 'location';
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getGradientColors = () => {
    switch (variant) {
      case 'error':
        return ['#EF4444', '#F87171'] as const;
      case 'search':
        return colors.gradientPrimary;
      case 'location':
        return colors.gradientAccent;
      default:
        return colors.gradientCool;
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (variant) {
      case 'error':
        return 'alert-circle';
      case 'search':
        return 'search';
      case 'location':
        return 'location';
      default:
        return icon;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon with gradient background */}
        <LinearGradient
          colors={[...getGradientColors()]}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={getIconName()} size={40} color="#FFFFFF" />
        </LinearGradient>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>

        {/* Message */}
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>

        {/* Decorative dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.6 }]} />
          <View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.3 }]} />
        </View>

        {/* Action button */}
        {action && (
          <View style={styles.actionContainer}>
            {action}
          </View>
        )}

        {/* Helpful tips */}
        <View style={[styles.tipsContainer, { backgroundColor: colors.muted }]}>
          <View style={styles.tipRow}>
            <Ionicons name="bulb" size={16} color={colors.warning} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {variant === 'search' 
                ? 'Try using different keywords or expand your search area'
                : variant === 'location'
                  ? 'Make sure location permissions are enabled in settings'
                  : 'Pull down to refresh or check your connection'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionContainer: {
    marginBottom: 24,
  },
  tipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
});
