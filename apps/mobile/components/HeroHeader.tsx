import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Dimensions,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  theCragUrl?: string | null;
  rockType?: string | null;
  climbingType?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  onBack: () => void;
  stats?: {
    label: string;
    value: string | number;
    icon?: keyof typeof Ionicons.glyphMap;
  }[];
  badge?: {
    label: string;
    color?: string;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  actions?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
  }[];
}

// Unsplash images for climbing - curated collection
const CLIMBING_IMAGES = {
  limestone: [
    'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80',
    'https://images.unsplash.com/photo-1504699439244-a5c26a5e9933?w=800&q=80',
  ],
  granite: [
    'https://images.unsplash.com/photo-1516592673884-4a382d1124c3?w=800&q=80',
    'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80',
  ],
  sandstone: [
    'https://images.unsplash.com/photo-1533497394934-b33cd9695ba9?w=800&q=80',
  ],
  boulder: [
    'https://images.unsplash.com/photo-1601024445121-e5b82f02f2f4?w=800&q=80',
    'https://images.unsplash.com/photo-1606956330259-d9252cf32b22?w=800&q=80',
  ],
  sport: [
    'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80',
    'https://images.unsplash.com/photo-1516592673884-4a382d1124c3?w=800&q=80',
    'https://images.unsplash.com/photo-1504699439244-a5c26a5e9933?w=800&q=80',
    'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80',
  ],
};

function getImageUrl(
  imageUrl?: string | null,
  theCragUrl?: string | null,
  rockType?: string | null,
  climbingType?: string | null
): string {
  // 1. Use provided imageUrl if available
  if (imageUrl) {
    return imageUrl;
  }

  // 3. Select from curated Unsplash images based on rock type or climbing type
  const rockTypeLower = rockType?.toLowerCase() || '';
  const climbingTypeLower = climbingType?.toLowerCase() || '';

  let images = CLIMBING_IMAGES.default;

  if (rockTypeLower.includes('limestone') || rockTypeLower.includes('caliza')) {
    images = CLIMBING_IMAGES.limestone;
  } else if (rockTypeLower.includes('granite') || rockTypeLower.includes('granito')) {
    images = CLIMBING_IMAGES.granite;
  } else if (rockTypeLower.includes('sandstone') || rockTypeLower.includes('arenisca')) {
    images = CLIMBING_IMAGES.sandstone;
  } else if (climbingTypeLower.includes('boulder') || climbingTypeLower.includes('bloque')) {
    images = CLIMBING_IMAGES.boulder;
  } else if (climbingTypeLower.includes('sport') || climbingTypeLower.includes('deportiva')) {
    images = CLIMBING_IMAGES.sport;
  }

  // Return a random image from the selected category
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

export function HeroHeader({
  title,
  subtitle,
  imageUrl,
  theCragUrl,
  rockType,
  climbingType,
  icon = 'location',
  onBack,
  stats,
  badge,
  actions,
}: HeroHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [imageError, setImageError] = useState(false);

  const selectedImageUrl = getImageUrl(imageUrl, theCragUrl, rockType, climbingType);

  // Reset error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  const renderContent = () => (
    <>
      {/* Top navigation bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* Back button */}
        <Pressable 
          style={styles.backButton} 
          onPress={handleBackPress}
          hitSlop={8}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={colorScheme} style={styles.backButtonBlur}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </BlurView>
          ) : (
            <View style={styles.backButtonAndroid}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </View>
          )}
        </Pressable>

        {/* Action buttons */}
        {actions && actions.length > 0 && (
          <View style={styles.actionsRow}>
            {actions.map((action, index) => (
              <Pressable 
                key={index}
                style={styles.actionButton} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  action.onPress();
                }}
                hitSlop={8}
              >
                {Platform.OS === 'ios' ? (
                  <BlurView intensity={80} tint={colorScheme} style={styles.actionButtonBlur}>
                    <Ionicons name={action.icon} size={20} color={action.color || '#FFF'} />
                  </BlurView>
                ) : (
                  <View style={styles.actionButtonAndroid}>
                    <Ionicons name={action.icon} size={20} color={action.color || '#FFF'} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Bottom overlay with content */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
        style={styles.overlay}
      >
        <View style={styles.headerContent}>
          {/* Badge */}
          {badge && (
            <View
              style={[
                styles.badge,
                { backgroundColor: badge.color || colors.primary },
              ]}
            >
              {badge.icon && (
                <Ionicons name={badge.icon} size={12} color="#FFF" />
              )}
              <Text style={styles.badgeText}>{badge.label}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Subtitle */}
          {subtitle && (
            <View style={styles.subtitleRow}>
              <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          )}

          {/* Stats row */}
          {stats && stats.length > 0 && (
            <View style={styles.statsRow}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  {stat.icon && (
                    <Ionicons name={stat.icon} size={14} color="rgba(255,255,255,0.95)" />
                  )}
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>
    </>
  );

  if (imageError) {
    // Fallback to gradient
    return (
      <LinearGradient colors={[...colors.gradientPrimary]} style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={56} color="rgba(255,255,255,0.2)" />
        </View>
        {renderContent()}
      </LinearGradient>
    );
  }

  return (
    <ImageBackground
      source={{ uri: selectedImageUrl }}
      style={styles.container}
      resizeMode="cover"
      onError={() => setImageError(true)}
    >
      {renderContent()}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: SCREEN_WIDTH,
    position: 'relative',
    justifyContent: 'space-between',
  },
  iconContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  backButtonAndroid: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  actionButtonAndroid: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 100,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
});
