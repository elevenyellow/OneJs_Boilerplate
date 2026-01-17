import { Notifier, Easing } from 'react-native-notifier'
import { CustomNotification } from './CustomNotification'

/**
 * Elegant notification service using React Native Notifier
 * Features: safe area support, smooth animations, swipe gestures
 */
export const notify = {
  /**
   * Shows a success notification
   */
  success(title: string, description?: string, duration?: number): void {
    Notifier.showNotification({
      title,
      description,
      duration: duration || 3000,
      showAnimationDuration: 400,
      showEasing: Easing.bounce,
      hideOnPress: true,
      Component: CustomNotification,
      componentProps: {
        type: 'success',
      },
      containerStyle: {
        top: 60, // Posición fija desde arriba
      },
      queueMode: 'standby',
    })
  },

  /**
   * Shows an error notification
   */
  error(title: string, description?: string, duration?: number): void {
    Notifier.showNotification({
      title,
      description,
      duration: duration || 4000,
      showAnimationDuration: 400,
      showEasing: Easing.bounce,
      hideOnPress: true,
      Component: CustomNotification,
      componentProps: {
        type: 'error',
      },
      containerStyle: {
        top: 60, // Posición fija desde arriba
      },
      queueMode: 'standby',
    })
  },

  /**
   * Shows an info notification
   */
  info(title: string, description?: string, duration?: number): void {
    Notifier.showNotification({
      title,
      description,
      duration: duration || 3000,
      showAnimationDuration: 400,
      showEasing: Easing.bounce,
      hideOnPress: true,
      Component: CustomNotification,
      componentProps: {
        type: 'info',
      },
      containerStyle: {
        top: 60, // Posición fija desde arriba
      },
      queueMode: 'standby',
    })
  },

  /**
   * Hides the currently displayed notification
   */
  hide(): void {
    Notifier.hideNotification()
  },
}
