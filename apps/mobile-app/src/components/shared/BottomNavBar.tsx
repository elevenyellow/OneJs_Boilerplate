import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, InteractionManager } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { haptics } from '@/services/haptics'
import {
  CompassOutlineIcon,
  CompassIcon,
  MapOutlineIcon,
  MapIcon,
  CalendarOutlineIcon,
  CalendarIcon,
  SettingsOutlineIcon,
  SettingsIcon,
} from './icons'
import { colors } from '@/theme/colors'
import type { MainTabParamList, RootStackParamList } from '@/navigation/types'

type TabConfig = {
  name: keyof MainTabParamList
  labelKey: string
  IconOutline: React.ComponentType<{ size?: number; color?: string }>
  IconFilled: React.ComponentType<{ size?: number; color?: string }>
  color: string
}

const TABS: TabConfig[] = [
  {
    name: 'Explorer',
    labelKey: 'navigation.explore',
    IconOutline: CompassOutlineIcon,
    IconFilled: CompassIcon,
    color: colors.accent.DEFAULT,
  },
  {
    name: 'Map',
    labelKey: 'navigation.map',
    IconOutline: MapOutlineIcon,
    IconFilled: MapIcon,
    color: colors.grade.easy,
  },
  {
    name: 'Performance',
    labelKey: 'navigation.sessions',
    IconOutline: CalendarOutlineIcon,
    IconFilled: CalendarIcon,
    color: colors.grade.medium,
  },
  {
    name: 'Settings',
    labelKey: 'navigation.settings',
    IconOutline: SettingsOutlineIcon,
    IconFilled: SettingsIcon,
    color: colors.grade.extreme,
  },
]

/**
 * Determines the active tab based on navigation state
 * Handles child screens by looking for originTab parameter
 */
function getActiveTabFromNavigationState(
  navState: any,
): keyof MainTabParamList | undefined {
  if (!navState) return undefined

  // Get the current route (top of the stack)
  const currentRoute = navState.routes?.[navState.index ?? -1]
  if (!currentRoute) return undefined

  const routeName = currentRoute.name

  // If on MainTabs, get the active tab
  if (routeName === 'MainTabs' && currentRoute.state) {
    const tabState = currentRoute.state as {
      routes?: Array<{ name?: string }>
      index?: number
    }
    const activeTabRoute = tabState.routes?.[tabState.index ?? -1]
    return activeTabRoute?.name as keyof MainTabParamList | undefined
  }

  // For child screens (Search, Crag, Sector, LogAscent), check originTab parameter
  if (
    routeName === 'Search' ||
    routeName === 'Crag' ||
    routeName === 'Sector' ||
    routeName === 'LogAscent'
  ) {
    const originTab = currentRoute.params?.originTab as
      | keyof MainTabParamList
      | undefined
    if (originTab) {
      return originTab
    }
  }

  // If we're on a child screen without originTab, try to find the last MainTab in the stack
  for (let i = navState.index ?? 0; i >= 0; i--) {
    const route = navState.routes[i]
    if (route.name === 'MainTabs' && route.state) {
      const tabState = route.state as {
        routes?: Array<{ name?: string }>
        index?: number
      }
      const activeTabRoute = tabState.routes?.[tabState.index ?? -1]
      return activeTabRoute?.name as keyof MainTabParamList | undefined
    }
  }

  return undefined
}

/**
 * Custom bottom tab bar for the Tab Navigator.
 * Can also be used standalone outside Tab Navigator.
 */
export const BottomNavBar = memo(function BottomNavBar(
  props?: Partial<BottomTabBarProps>,
) {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const [activeTabName, setActiveTabName] = useState<
    keyof MainTabParamList | undefined
  >(undefined)
  const updateHandleRef = useRef<ReturnType<
    typeof InteractionManager.runAfterInteractions
  > | null>(null)
  const isTransitioningRef = useRef(false)

  // Listen to navigation state changes to detect active tab
  useEffect(() => {
    const updateActiveTab = () => {
      // Clear any pending updates
      if (updateHandleRef.current) {
        updateHandleRef.current.cancel()
        updateHandleRef.current = null
      }

      // Use InteractionManager to wait for animations to complete
      const handle = InteractionManager.runAfterInteractions(() => {
        try {
          const navState = navigation.getState()
          const tabName = getActiveTabFromNavigationState(navState)
          setActiveTabName(tabName)
          isTransitioningRef.current = false
          updateHandleRef.current = null
        } catch {
          // Navigation state not available
          setActiveTabName(undefined)
          isTransitioningRef.current = false
          updateHandleRef.current = null
        }
      })

      // Store handle for cleanup
      updateHandleRef.current = handle
    }

    // Initial update
    updateActiveTab()

    // Listen to state change events to catch all navigation changes
    const unsubscribeState = navigation.addListener('state', () => {
      updateActiveTab()
    })

    // Listen to focus events which fire after navigation completes
    // This avoids updates during transitions
    const unsubscribeFocus = navigation.addListener('focus', () => {
      isTransitioningRef.current = true
      // Wait for interactions to complete before updating
      updateActiveTab()
    })

    // Also listen to blur to detect when we're leaving a tab screen
    const unsubscribeBlur = navigation.addListener('blur', () => {
      isTransitioningRef.current = true
    })

    return () => {
      if (updateHandleRef.current) {
        updateHandleRef.current.cancel()
        updateHandleRef.current = null
      }
      unsubscribeState()
      unsubscribeFocus()
      unsubscribeBlur()
    }
  }, [navigation])

  // Always use activeTabName from our getActiveTabFromNavigationState logic
  const finalActiveTabName = activeTabName

  const handleTabPress = useCallback(
    (tabName: keyof MainTabParamList) => {
      haptics.light()

      if (props?.navigation && props?.state) {
        // Used within Tab Navigator
        const tabRoute = props.state.routes.find((r) => r.name === tabName)
        if (tabRoute) {
          const event = props.navigation.emit({
            type: 'tabPress',
            target: tabRoute.key,
            canPreventDefault: true,
          })

          if (!event.defaultPrevented) {
            props.navigation.navigate(tabName)
          }
        }
      } else {
        // Used standalone - navigate to MainTabs with specific tab
        const rootNavigation = navigation as CompositeNavigationProp<
          BottomTabNavigationProp<MainTabParamList>,
          NativeStackNavigationProp<RootStackParamList>
        >
        rootNavigation.navigate('MainTabs', {
          screen: tabName,
        })
      }
    },
    [props?.navigation, props?.state, navigation],
  )

  // Get routes for rendering - either from props or use all tabs
  const routesToRender = useMemo(() => {
    if (props?.state?.routes) {
      return props.state.routes
    }
    // Standalone mode - create mock routes for all tabs
    return TABS.map((tab, index) => ({
      key: `tab-${tab.name}`,
      name: tab.name,
      params: undefined,
    }))
  }, [props?.state?.routes])

  return (
    <View className="flex-row bg-nav border-t border-border pb-3 pt-1.5 px-1">
      {routesToRender.map((routeItem, index) => {
        const tabConfig = TABS.find((t) => t.name === routeItem.name)
        if (!tabConfig) return null

        // Always use finalActiveTabName for consistency with originTab detection
        const isFocused = finalActiveTabName === tabConfig.name

        const IconComponent = isFocused
          ? tabConfig.IconFilled
          : tabConfig.IconOutline

        return (
          <TouchableOpacity
            key={routeItem.key || `tab-${tabConfig.name}`}
            className="flex-1 items-center relative"
            onPress={() => handleTabPress(tabConfig.name)}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <IconComponent
              size={24}
              color={isFocused ? tabConfig.color : colors.text.muted}
            />
            <Text
              className={`text-[11px] mt-1 ${isFocused ? 'font-semibold' : 'text-gray-500'}`}
              style={isFocused ? { color: tabConfig.color } : undefined}
            >
              {t(tabConfig.labelKey)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
})
