import './global.css'
import './src/i18n' // Initialize i18n
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import Constants from 'expo-constants'
import * as WebBrowser from 'expo-web-browser'

// Complete OAuth session in the browser
WebBrowser.maybeCompleteAuthSession()

// Configure Reanimated logger to reduce noise in development
// The "Writing to value during render" warning is a known safe pattern
// when using useEffect to initialize animations
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Disable strict mode warnings
})
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { QueryClientProvider } from '@tanstack/react-query'
import { MainTabNavigator } from '@/navigation/MainTabNavigator'
import { AuthScreen } from '@/screens/AuthScreen'
import { SearchScreen } from '@/screens/SearchScreen'
import { CragScreen } from '@/screens/CragScreen'
import { SectorScreen } from '@/screens/SectorScreen'
import { LogAscentScreen } from '@/screens/LogAscentScreen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { PersistentBottomNavBar } from '@/components/shared/PersistentBottomNavBar'
import { queryClient } from '@/config/queryClient'
import { colors } from '@/theme/colors'
import { PreferencesProvider } from '@/contexts/PreferencesContext'
import type { RootStackParamList } from '@/navigation/types'
import { ActivityIndicator, View } from 'react-native'
import { setGetTokenFunction } from '@/config/authToken'
import { NotifierWrapper } from 'react-native-notifier'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const Stack = createNativeStackNavigator<RootStackParamList>()

// Get Clerk publishable key from environment
const clerkPublishableKey =
  Constants.expoConfig?.extra?.clerkPublishableKey ||
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  ''

/**
 * Main App Navigator - shows AuthScreen or MainTabs based on auth state
 */
function AppNavigator() {
  const { isSignedIn, isLoaded, getToken } = useAuth()

  // Register getToken function so it can be used outside React components
  useEffect(() => {
    console.log(
      '[AppNavigator] getToken available:',
      typeof getToken === 'function',
    )
    if (getToken && typeof getToken === 'function') {
      console.log('[AppNavigator] Registering getToken function')
      setGetTokenFunction(getToken)
    } else {
      console.warn('[AppNavigator] getToken is not a function, clearing')
      setGetTokenFunction(null)
    }
  }, [getToken])

  // Show loading while checking auth state
  if (!isLoaded) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
      </View>
    )
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent.DEFAULT,
          background: colors.bg.primary,
          card: colors.bg.primary,
          text: colors.text.primary,
          border: colors.border.default,
          notification: colors.status.error,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '800',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: 'slide_from_right',
        }}
      >
        {!isSignedIn ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{
                animation: 'fade_from_bottom',
                animationDuration: 200,
              }}
            />
            <Stack.Screen name="Crag" component={CragScreen} />
            <Stack.Screen name="Sector" component={SectorScreen} />
            <Stack.Screen
              name="LogAscent"
              component={LogAscentScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                animationDuration: 250,
                gestureEnabled: true,
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
      {isSignedIn && <PersistentBottomNavBar />}
      <StatusBar style="light" />
    </NavigationContainer>
  )
}

export default function App() {
  console.log('🚀 [App] Component rendering...')

  if (!clerkPublishableKey) {
    console.warn('⚠️ [App] Clerk publishable key not found. Auth will not work.')
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <QueryClientProvider client={queryClient}>
          <PreferencesProvider>
            <SafeAreaProvider>
              <NotifierWrapper>
                <AppNavigator />
              </NotifierWrapper>
            </SafeAreaProvider>
          </PreferencesProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  )
}
