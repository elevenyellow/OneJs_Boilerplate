import { View, Text, TouchableOpacity } from 'react-native'
import type { LanguageOption } from './types'

interface LanguageSelectorProps {
  languages: LanguageOption[]
  selectedLanguage: string
  onLanguageChange: (languageCode: string) => void
}

export function LanguageSelector({
  languages,
  selectedLanguage,
  onLanguageChange,
}: LanguageSelectorProps) {
  if (languages.length <= 1) {
    return null
  }

  return (
    <View className="flex-row items-center px-4 py-3 bg-card border-b border-border">
      <Text className="text-gray-400 text-[13px] font-semibold mr-3">
        Idioma:
      </Text>
      <View className="flex-row gap-2 flex-1">
        {languages.map((lang) => {
          const isActive = selectedLanguage === lang.code
          return (
            <TouchableOpacity
              key={lang.code}
              className={`w-12 h-12 rounded-full bg-border items-center justify-center border-2 ${isActive ? 'border-accent bg-accent/10' : 'border-transparent'}`}
              onPress={() => onLanguageChange(lang.code)}
            >
              <Text className="text-[28px]">{lang.flag}</Text>
              {isActive && (
                <View className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
