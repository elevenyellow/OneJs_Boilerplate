/**
 * Approach Info Sheet
 *
 * Bottom sheet modal that displays approach/access information for a sector.
 * Uses the ApproachInfoSection component for content.
 */

import { Modal, View, TouchableWithoutFeedback } from 'react-native'
import { ApproachInfoSection, type ApproachData } from './ApproachInfoSection'

interface ApproachInfoSheetProps {
  /** Whether the sheet is visible */
  visible: boolean
  /** Approach data to display */
  approach: ApproachData
  /** Called when the sheet should close */
  onClose: () => void
  /** Called when download button is pressed */
  onDownload?: () => void
}

export function ApproachInfoSheet({
  visible,
  approach,
  onClose,
  onDownload,
}: ApproachInfoSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableWithoutFeedback>
            <View>
              <ApproachInfoSection
                approach={approach}
                onDownload={onDownload}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
