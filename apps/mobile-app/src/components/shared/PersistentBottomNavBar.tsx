import { View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BottomNavBar } from './BottomNavBar'
import type { RootStackParamList } from '@/navigation/types'

/**
 * Wrapper component that shows BottomNavBar persistently across all screens.
 * Must be used inside NavigationContainer.
 */
export function PersistentBottomNavBar() {
  // This hook ensures we're inside NavigationContainer
  useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <View className="absolute bottom-0 left-0 right-0 z-50">
      <BottomNavBar />
    </View>
  )
}
