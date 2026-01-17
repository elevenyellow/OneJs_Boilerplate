// i18n type augmentation
// We use loose typing to allow dynamic translation keys
// This is intentional for components like BottomNavBar that store keys in arrays

import 'i18next'

declare module 'i18next' {
  interface CustomTypeOptions {
    // Disable strict typing to allow dynamic keys
    allowObjectInHTMLChildren: true
  }
}
