import { View, Text } from 'react-native'
import {
  TimeOutlineIcon,
  NavigateOutlineIcon,
  TrendingUpOutlineIcon,
  WarningIcon,
  BulbIcon,
} from './icons'
// EXCEPTION: Ionicons is used here for dynamic icon rendering where icon name comes from API data.
// The section.icon value is provided by the backend and can be any Ionicon name.
// Using wrapper components is not feasible for truly dynamic icons.
import { Ionicons } from '@expo/vector-icons'

interface ParsedBetaItem {
  name: string
  originalMarkdown: string
  keyInfo: {
    walkTime: string | null
    distance: string | null
    difficulty: string | null
  }
  warnings: string[]
  tips: string[]
  sections: Array<{
    type: string
    icon: string
    content: string
    color: string
  }>
}

interface BetaContentProps {
  betaItem: ParsedBetaItem
}

export function BetaContent({ betaItem }: BetaContentProps) {
  return (
    <View className="p-4 border-b border-border">
      {/* Header */}
      <View className="mb-3">
        <Text className="text-white text-base font-bold">{betaItem.name}</Text>
      </View>

      {/* Key info badges - Already parsed from backend */}
      {(betaItem.keyInfo.walkTime ||
        betaItem.keyInfo.distance ||
        betaItem.keyInfo.difficulty) && (
        <View className="flex-row flex-wrap gap-2 mb-4">
          {betaItem.keyInfo.walkTime && (
            <View className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/15 border border-accent/30">
              <TimeOutlineIcon size={16} />
              <Text className="text-accent text-[13px] font-semibold">
                {betaItem.keyInfo.walkTime}
              </Text>
            </View>
          )}
          {betaItem.keyInfo.distance && (
            <View className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/15 border border-accent/30">
              <NavigateOutlineIcon size={16} />
              <Text className="text-accent text-[13px] font-semibold">
                {betaItem.keyInfo.distance}
              </Text>
            </View>
          )}
          {betaItem.keyInfo.difficulty && (
            <View className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/15 border border-accent/30">
              <TrendingUpOutlineIcon size={16} />
              <Text className="text-accent text-[13px] font-semibold">
                {betaItem.keyInfo.difficulty}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Warnings - Already extracted from backend */}
      {betaItem.warnings.length > 0 && (
        <View className="mb-4 gap-2">
          {betaItem.warnings.map((warning, index) => (
            <View
              key={index}
              className="flex-row items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border-l-[3px] border-l-amber-500"
            >
              <WarningIcon size={18} />
              <Text className="flex-1 text-amber-300 text-[13px] leading-5 pt-px">
                {warning}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Parsed content - Already has icons and colors from backend */}
      <View className="gap-2.5">
        {betaItem.sections.map((section, index) => (
          <View key={index} className="flex-row items-start gap-2.5">
            <Ionicons
              name={section.icon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={section.color}
              style={{ marginTop: 3, width: 16 }}
            />
            <Text
              className="flex-1 text-sm leading-[22px]"
              style={{ color: section.color }}
            >
              {section.content}
            </Text>
          </View>
        ))}
      </View>

      {/* Tips - Already extracted from backend */}
      {betaItem.tips.length > 0 && (
        <View className="mt-4 gap-2">
          {betaItem.tips.map((tip, index) => (
            <View
              key={index}
              className="flex-row items-start gap-2.5 p-3 rounded-lg bg-blue-500/10 border-l-[3px] border-l-blue-500"
            >
              <BulbIcon size={18} />
              <Text className="flex-1 text-blue-300 text-[13px] leading-5 pt-px">
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
