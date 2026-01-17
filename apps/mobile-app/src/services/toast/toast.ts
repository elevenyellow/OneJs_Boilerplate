import Toast from 'react-native-toast-message'

/**
 * Toast service wrapper - provides a centralized interface for showing toast notifications
 */
export const toast = {
  /**
   * Shows a success toast notification
   * @param message - The message to display
   * @param duration - Duration in milliseconds (default: 3000)
   */
  success: (message: string, duration: number = 3000) => {
    Toast.show({
      type: 'success',
      text1: message,
      position: 'top',
      visibilityTime: duration,
      topOffset: 60,
    })
  },

  /**
   * Shows an error toast notification
   * @param message - The message to display
   * @param duration - Duration in milliseconds (default: 4000)
   */
  error: (message: string, duration: number = 4000) => {
    Toast.show({
      type: 'error',
      text1: message,
      position: 'top',
      visibilityTime: duration,
      topOffset: 60,
    })
  },

  /**
   * Shows an info toast notification
   * @param message - The message to display
   * @param duration - Duration in milliseconds (default: 3000)
   */
  info: (message: string, duration: number = 3000) => {
    Toast.show({
      type: 'info',
      text1: message,
      position: 'top',
      visibilityTime: duration,
      topOffset: 60,
    })
  },

  /**
   * Shows a warning toast notification
   * @param message - The message to display
   * @param duration - Duration in milliseconds (default: 3500)
   */
  warning: (message: string, duration: number = 3500) => {
    Toast.show({
      type: 'error', // react-native-toast-message doesn't have a warning type by default, using error
      text1: message,
      position: 'top',
      visibilityTime: duration,
      topOffset: 60,
    })
  },

  /**
   * Hides the currently displayed toast
   */
  hide: () => {
    Toast.hide()
  },
}
