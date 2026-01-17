import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ExplorerScreen } from '@/screens/ExplorerScreen'
import { MapScreen } from '@/screens/MapScreen'
import { PerformanceScreen } from '@/screens/PerformanceScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { colors } from '@/theme/colors'
import type { MainTabParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg.primary },
      }}
    >
      <Tab.Screen name="Explorer" component={ExplorerScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Performance" component={PerformanceScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}
