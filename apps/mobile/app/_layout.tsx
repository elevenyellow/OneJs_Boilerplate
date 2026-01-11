import { GlobalGradePickerModal } from '@/components/GlobalGradePickerModal'
import { Colors } from '@/constants/Colors'
import { FiltersProvider } from '@/contexts/FiltersContext'
import { asyncStoragePersister, queryClient } from '@/lib/queryClient'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light'
  const colors = Colors[colorScheme]

  useEffect(() => {
    // Hide splash screen after fonts/resources loaded
    SplashScreen.hideAsync()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <FiltersProvider>
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
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="crag/weather/[id]"
            options={{
              title: 'Weather',
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="crag/info/[id]"
            options={{
              title: 'Info',
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="crag/filters/[id]"
            options={{
              title: 'Filters',
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          </Stack>
          <GlobalGradePickerModal />
        </FiltersProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  )
}
