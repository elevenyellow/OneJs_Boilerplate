import { View, Text, TouchableOpacity } from 'react-native'
import { colors } from '@/theme/colors'
import type { ParsedBetaDto } from '@/types/api'
import type { LanguageOption } from '../types'

interface EthicSectionProps {
  availableLanguages: LanguageOption[]
  selectedLanguage: string
  onLanguageChange: (languageCode: string) => void
}

export function EthicSection({
  availableLanguages,
  selectedLanguage,
  onLanguageChange,
}: EthicSectionProps) {
  // Find the ethic item for each language
  const getEthicForLanguage = (languageCode: string) => {
    const langOption = availableLanguages.find((l) => l.code === languageCode)
    if (!langOption) return null
    return langOption.betaItems.find((item) => item.name === 'Ethic')
  }

  const currentEthic = getEthicForLanguage(selectedLanguage)

  // If no ethic content exists in any language, don't render
  const hasAnyEthic = availableLanguages.some((lang) =>
    lang.betaItems.some((item) => item.name === 'Ethic'),
  )

  if (!hasAnyEthic) return null

  // Extract text content from sections
  const getTextContent = (ethicItem: ParsedBetaDto) => {
    return ethicItem.sections.map((section) => section.content).join('\n\n')
  }

  // Get languages that have ethic content
  const languagesWithEthic = availableLanguages.filter((lang) =>
    lang.betaItems.some((item) => item.name === 'Ethic'),
  )

  return (
    <View className="mx-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white text-lg font-bold">
          {currentEthic?.name || 'Ethic'}
        </Text>
      </View>

      {/* Language Tabs - Show if there are multiple languages with ethic */}
      {languagesWithEthic.length > 1 && (
        <View className="flex-row gap-2 mb-3 flex-wrap">
          {languagesWithEthic.map((lang) => {
            const isActive = selectedLanguage === lang.code
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => onLanguageChange(lang.code)}
                className={`flex-row items-center px-4 py-2.5 rounded-full ${
                  isActive
                    ? 'bg-accent border-2 border-accent'
                    : 'bg-card border-2 border-border-muted'
                }`}
                activeOpacity={0.7}
              >
                <Text className="text-xl mr-2">{lang.flag}</Text>
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {/* Content */}
      {currentEthic && (
        <>
          <View className="bg-card border border-border-muted rounded-lg p-4">
            <Text className="text-gray-300 text-sm leading-6">
              {getTextContent(currentEthic)}
            </Text>
          </View>

          {/* Warnings if any */}
          {currentEthic.warnings.length > 0 && (
            <View className="mt-3 gap-2">
              {currentEthic.warnings.map((warning, index) => (
                <View
                  key={index}
                  className="flex-row items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border-l-[3px] border-l-amber-500"
                >
                  <Text className="flex-1 text-amber-300 text-xs leading-5">
                    ⚠️ {warning}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  )
}
