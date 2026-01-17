import { useState, useCallback, useEffect, useMemo } from 'react'
import type { ParsedBetaDto } from '@/types/api'
import type { LanguageOption } from '@/components/crag/types'

interface UseBetaLanguagesResult {
  selectedLanguage: string
  setSelectedLanguage: (lang: string) => void
  availableLanguages: LanguageOption[]
  betaToShow: ParsedBetaDto[]
}

export function useBetaLanguages(
  betaItems: ParsedBetaDto[] | null | undefined,
): UseBetaLanguagesResult {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('es')

  const detectLanguage = useCallback((betaItem: ParsedBetaDto): string => {
    const markdown = betaItem.originalMarkdown.toLowerCase()
    const name = betaItem.name.toLowerCase()

    if (
      markdown.includes('🇪🇸') ||
      markdown.includes(':es:') ||
      name.includes('español') ||
      name.includes('spanish')
    )
      return 'es'
    if (
      markdown.includes('🇬🇧') ||
      markdown.includes('🇺🇸') ||
      markdown.includes(':gb:') ||
      markdown.includes(':us:') ||
      name.includes('english') ||
      name.includes('inglés')
    )
      return 'en'
    if (
      markdown.includes('🇫🇷') ||
      markdown.includes(':fr:') ||
      name.includes('français') ||
      name.includes('french') ||
      name.includes('francés')
    )
      return 'fr'
    if (
      markdown.includes('🇩🇪') ||
      markdown.includes(':de:') ||
      name.includes('deutsch') ||
      name.includes('german') ||
      name.includes('alemán')
    )
      return 'de'
    if (
      markdown.includes('🇮🇹') ||
      markdown.includes(':it:') ||
      name.includes('italiano') ||
      name.includes('italian')
    )
      return 'it'
    if (
      markdown.includes('🇵🇹') ||
      markdown.includes(':pt:') ||
      name.includes('português') ||
      name.includes('portuguese') ||
      name.includes('portugués')
    )
      return 'pt'

    return 'general'
  }, [])

  const getLanguageInfo = useCallback(
    (lang: string): { flag: string; name: string } => {
      const languageMap: Record<string, { flag: string; name: string }> = {
        es: { flag: '🇪🇸', name: 'Español' },
        en: { flag: '🇬🇧', name: 'English' },
        fr: { flag: '🇫🇷', name: 'Français' },
        de: { flag: '🇩🇪', name: 'Deutsch' },
        it: { flag: '🇮🇹', name: 'Italiano' },
        pt: { flag: '🇵🇹', name: 'Português' },
        general: { flag: '🌐', name: 'General' },
      }
      return languageMap[lang] || { flag: '🌐', name: 'General' }
    },
    [],
  )

  const availableLanguages = useMemo<LanguageOption[]>(() => {
    if (!betaItems || betaItems.length === 0) return []

    const languageMap: Record<string, LanguageOption> = {}

    for (const item of betaItems) {
      const lang = detectLanguage(item)
      if (!languageMap[lang]) {
        const info = getLanguageInfo(lang)
        languageMap[lang] = {
          code: lang,
          flag: info.flag,
          name: info.name,
          betaItems: [],
        }
      }
      languageMap[lang].betaItems.push(item)
    }

    return Object.values(languageMap)
  }, [betaItems, detectLanguage, getLanguageInfo])

  // Initialize selected language when beta items change
  useEffect(() => {
    if (availableLanguages.length > 0) {
      const hasCurrentLanguage = availableLanguages.some(
        (lang) => lang.code === selectedLanguage,
      )
      if (!hasCurrentLanguage) {
        const generalLang = availableLanguages.find(
          (lang) => lang.code === 'general',
        )
        setSelectedLanguage(generalLang?.code || availableLanguages[0].code)
      }
    }
  }, [availableLanguages, selectedLanguage])

  const betaToShow = useMemo<ParsedBetaDto[]>(() => {
    if (availableLanguages.length === 0) return []

    const currentLanguageData = availableLanguages.find(
      (lang) => lang.code === selectedLanguage,
    )

    if (currentLanguageData) {
      return currentLanguageData.betaItems
    }

    const generalLang = availableLanguages.find(
      (lang) => lang.code === 'general',
    )
    return generalLang?.betaItems || availableLanguages[0]?.betaItems || []
  }, [availableLanguages, selectedLanguage])

  return {
    selectedLanguage,
    setSelectedLanguage,
    availableLanguages,
    betaToShow,
  }
}
