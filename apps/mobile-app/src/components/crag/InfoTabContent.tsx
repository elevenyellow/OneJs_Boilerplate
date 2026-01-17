/**
 * Info Tab Content
 *
 * Displays sector information including:
 * - Compact 3-block info row (Maps, Height, Kudos)
 * - Tags section with all tags displayed
 * - Ethic section with language selector
 */

import { View, Text, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { DocumentTextOutlineIcon } from '@/components/shared/icons'
import { colors } from '@/theme/colors'
import { InfoRow, TagsDetailSection, EthicSection } from './info-tab'
import type { ParsedBetaDto } from '@/types/api'
import type { LanguageOption, SectorWithPhoto } from './types'

// =============================================================================
// Types
// =============================================================================

interface InfoTabContentProps {
  betaItems: ParsedBetaDto[]
  availableLanguages: LanguageOption[]
  selectedLanguage: string
  onLanguageChange: (languageCode: string) => void
  /** Current sector data for approach info */
  sector?: SectorWithPhoto | null
}

// =============================================================================
// Main Component
// =============================================================================

export function InfoTabContent({
  betaItems,
  availableLanguages,
  selectedLanguage,
  onLanguageChange,
  sector,
}: InfoTabContentProps) {
  const { t } = useTranslation()

  // Check if any language has ethic content
  const hasEthic = availableLanguages.some((lang) =>
    lang.betaItems.some((item) => item.name === 'Ethic'),
  )

  // Check if we have any data to display in Row 1
  const hasInfoRow =
    sector &&
    ((sector.latitude && sector.longitude) ||
      sector.averageHeight ||
      (sector.kudos !== null && sector.kudos !== undefined))

  const hasTags =
    sector &&
    (sector.weatherLabels ||
      sector.crowdsLabel ||
      sector.familyLabel ||
      sector.climbingStyle)

  // Empty state - no info at all
  if (!hasInfoRow && !hasTags && !hasEthic) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
      >
        <View className="items-center justify-center py-12 px-6">
          <DocumentTextOutlineIcon size={64} color={colors.text.muted} />
          <Text className="text-gray-400 text-center mt-4 text-sm">
            {t('sector.noInfoAvailable')}
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
    >
      {/* Row 1: 3 Info Blocks (without tags counter) */}
      {sector && hasInfoRow && <InfoRow sector={sector} />}

      {/* Tags Section - Always visible if there are tags */}
      {sector && hasTags && <TagsDetailSection sector={sector} />}

      {/* Row 2: Ethic Section with Tabs */}
      {hasEthic && (
        <EthicSection
          availableLanguages={availableLanguages}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
        />
      )}
    </ScrollView>
  )
}
