/**
 * Expo App Configuration
 * This file reads environment variables from the root .env file
 */

const fs = require('fs')
const path = require('path')

// Path to root .env file
const rootEnvPath = path.join(__dirname, '../../.env')

/**
 * Load environment variables from .env file
 */
function loadEnvFile() {
  const env = {}

  if (fs.existsSync(rootEnvPath)) {
    const envContent = fs.readFileSync(rootEnvPath, 'utf-8')
    const lines = envContent.split('\n')

    for (const line of lines) {
      const trimmedLine = line.trim()
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue
      }

      // Parse KEY=VALUE format
      const equalIndex = trimmedLine.indexOf('=')
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim()
        let value = trimmedLine.substring(equalIndex + 1).trim()

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }

        env[key] = value
      }
    }
  }

  return env
}

const env = loadEnvFile()

module.exports = {
  expo: {
    name: 'Climb App',
    slug: 'climb-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'climbapp',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0a0a0a',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.climbapp.mobile',
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true,
        },
        NSLocationWhenInUseUsageDescription:
          'We need your location to find climbing crags near you',
        NSLocationAlwaysUsageDescription:
          'We need your location to find climbing crags near you',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0a0a0a',
      },
      package: 'com.climbapp.mobile',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'INTERNET',
      ],
      usesCleartextTraffic: true,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow Climb App to use your location to find nearby crags.',
        },
      ],
      '@react-native-community/datetimepicker',
      'expo-localization',
      'expo-asset',
      'expo-font',
    ],
    extra: {
      // Make Clerk publishable key available via Constants.expoConfig.extra
      clerkPublishableKey:
        env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        '',
    },
  },
}
