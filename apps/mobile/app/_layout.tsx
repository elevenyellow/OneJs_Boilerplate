import { Colors } from '@/constants/Colors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  useEffect(() => {
    // Hide splash screen after fonts/resources loaded
    SplashScreen.hideAsync()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: '700',
            },
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="zone/[id]"
            options={{
              title: '',
              headerTransparent: true,
              headerTintColor: '#FFFFFF',
            }}
          />
          <Stack.Screen
            name="sector/[id]"
            options={{
              title: '',
              headerTransparent: true,
              headerTintColor: '#FFFFFF',
            }}
          />
          <Stack.Screen
            name="crag/[id]"
            options={{
              title: '',
              headerTransparent: true,
              headerTintColor: '#FFFFFF',
            }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
