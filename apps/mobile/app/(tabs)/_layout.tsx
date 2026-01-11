import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Tabs } from 'expo-router'
import { Platform, StyleSheet, useColorScheme, View } from 'react-native'

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap
  focused: boolean
  color: string
  size: number
}

function TabBarIcon({ name, focused, color, size }: TabBarIconProps) {
  return (
    <View style={styles.iconContainer}>
      {focused && (
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
          style={styles.iconBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Ionicons
        name={
          focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)
        }
        size={focused ? size + 2 : size}
        color={color}
      />
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: color }]} />
      )}
    </View>
  )
}

function TabBarBackground() {
  const colorScheme = useColorScheme() ?? 'light'

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={90}
        tint={colorScheme}
        style={StyleSheet.absoluteFill}
      />
    )
  }

  // Android fallback
  const colors = Colors[colorScheme]
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardGlass }]}
    />
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="compass"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="zones"
        options={{
          title: 'Map',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="map"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Saved',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="heart"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name="person"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
    position: 'relative',
  },
  iconBackground: {
    position: 'absolute',
    width: 48,
    height: 32,
    borderRadius: 16,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
})
