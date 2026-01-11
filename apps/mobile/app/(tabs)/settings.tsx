import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

const SETTINGS_STORAGE_KEY = 'climbzone-settings';

interface Settings {
  notifications: boolean;
  locationEnabled: boolean;
  offlineMode: boolean;
  measurementUnit: 'metric' | 'imperial';
  language: 'en' | 'es';
}

const defaultSettings: Settings = {
  notifications: false,
  locationEnabled: true,
  offlineMode: false,
  measurementUnit: 'metric',
  language: 'en',
};

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  colors: typeof Colors.light;
  isLast?: boolean;
}

function SettingsItem({
  icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  onPress,
  rightElement,
  colors,
  isLast,
}: SettingsItemProps) {
  return (
    <Pressable
      style={[
        styles.settingsItem,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
      ]}
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress && !rightElement}
    >
      <View
        style={[
          styles.settingsIconContainer,
          { backgroundColor: iconBackground || colors.muted },
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor || colors.primary} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingsSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement ?? (onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      ))}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  const openLink = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. You\'ll need to reload content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Clear AsyncStorage cache keys (not settings)
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith('cache-'));
            await AsyncStorage.multiRemove(cacheKeys);
            Alert.alert('Cache Cleared', 'All cached data has been removed.');
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    const storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/climbzone'
      : 'https://play.google.com/store/apps/details?id=com.climbzone.app';
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(storeUrl);
  };

  const handleShareApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Would integrate with Share API
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <LinearGradient
        colors={colors.gradientPrimary}
        style={[styles.profileHeader, { paddingTop: insets.top + 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.avatar}
            >
              <Ionicons name="person" size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.profileName}>Climber</Text>
          <Text style={styles.profileSubtitle}>Free account</Text>
          
          {/* Quick Stats */}
          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>0</Text>
              <Text style={styles.profileStatLabel}>Climbs</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>0</Text>
              <Text style={styles.profileStatLabel}>Saved</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>0</Text>
              <Text style={styles.profileStatLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* Decorative element */}
        <View style={styles.headerDecoration}>
          <Ionicons name="diamond" size={100} color="rgba(255,255,255,0.08)" />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Banner */}
        <Pressable
          style={[styles.premiumBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert('Premium', 'Premium features coming soon!');
          }}
        >
          <View style={[styles.premiumIconContainer, { backgroundColor: colors.warning }]}>
            <Ionicons name="diamond" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.premiumContent}>
            <Text style={[styles.premiumTitle, { color: colors.text }]}>Upgrade to Premium</Text>
            <Text style={[styles.premiumSubtitle, { color: colors.textSecondary }]}>
              Unlock offline maps, advanced stats & more
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.warning} />
        </Pressable>

        {/* Preferences section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsItem
              icon="notifications"
              iconColor="#F59E0B"
              iconBackground="#FEF3C7"
              title="Notifications"
              subtitle="Weather alerts & updates"
              colors={colors}
              rightElement={
                <Switch
                  value={settings.notifications}
                  onValueChange={(v) => updateSetting('notifications', v)}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingsItem
              icon="location"
              iconColor="#10B981"
              iconBackground="#D1FAE5"
              title="Location"
              subtitle="Find nearby sectors"
              colors={colors}
              rightElement={
                <Switch
                  value={settings.locationEnabled}
                  onValueChange={(v) => updateSetting('locationEnabled', v)}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingsItem
              icon="cloud-download"
              iconColor="#6366F1"
              iconBackground="#E0E7FF"
              title="Offline Mode"
              subtitle="Download data for offline use"
              colors={colors}
              isLast
              rightElement={
                <Switch
                  value={settings.offlineMode}
                  onValueChange={(v) => updateSetting('offlineMode', v)}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* Data sources */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA SOURCES</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsItem
              icon="globe"
              iconColor="#3B82F6"
              iconBackground="#DBEAFE"
              title="theCrag"
              subtitle="Climbing route database"
              onPress={() => openLink('https://www.thecrag.com')}
              colors={colors}
            />
            <SettingsItem
              icon="partly-sunny"
              iconColor="#F59E0B"
              iconBackground="#FEF3C7"
              title="Meteoblue"
              subtitle="Weather forecasts"
              onPress={() => openLink('https://www.meteoblue.com')}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUPPORT</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsItem
              icon="star"
              iconColor="#F59E0B"
              iconBackground="#FEF3C7"
              title="Rate the App"
              subtitle="Help us improve"
              onPress={handleRateApp}
              colors={colors}
            />
            <SettingsItem
              icon="share-social"
              iconColor="#8B5CF6"
              iconBackground="#EDE9FE"
              title="Share with Friends"
              onPress={handleShareApp}
              colors={colors}
            />
            <SettingsItem
              icon="chatbubble"
              iconColor="#10B981"
              iconBackground="#D1FAE5"
              title="Feedback"
              subtitle="Tell us what you think"
              onPress={() => openLink('mailto:feedback@climbzone.app')}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* Storage & Cache */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>STORAGE</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsItem
              icon="trash"
              iconColor="#EF4444"
              iconBackground="#FEE2E2"
              title="Clear Cache"
              subtitle="Free up space"
              onPress={handleClearCache}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsItem
              icon="information-circle"
              iconColor="#6366F1"
              iconBackground="#E0E7FF"
              title="Version"
              subtitle="1.0.0 (Build 1)"
              colors={colors}
            />
            <SettingsItem
              icon="document-text"
              iconColor="#64748B"
              iconBackground="#F1F5F9"
              title="Terms of Service"
              onPress={() => openLink('https://climbzone.app/terms')}
              colors={colors}
            />
            <SettingsItem
              icon="shield-checkmark"
              iconColor="#10B981"
              iconBackground="#D1FAE5"
              title="Privacy Policy"
              onPress={() => openLink('https://climbzone.app/privacy')}
              colors={colors}
            />
            <SettingsItem
              icon="code-slash"
              iconColor="#8B5CF6"
              iconBackground="#EDE9FE"
              title="Open Source Licenses"
              onPress={() => Alert.alert('Licenses', 'Built with React Native, Expo, and many amazing open source libraries.')}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.footerLogoGradient}
            >
              <Ionicons name="diamond" size={24} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            ClimbZone
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.mutedForeground }]}>
            Made with ❤️ for climbers
          </Text>
          <Text style={[styles.footerCopyright, { color: colors.mutedForeground }]}>
            © {new Date().getFullYear()} All rights reserved
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  profileContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  headerDecoration: {
    position: 'absolute',
    right: -20,
    top: 20,
    opacity: 0.5,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 16,
  },
  profileStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  profileStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    flex: 1,
    marginTop: 0,
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 0,
    marginTop: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    gap: 12,
  },
  premiumIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  premiumSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerLogo: {
    marginBottom: 12,
  },
  footerLogoGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
  },
});
