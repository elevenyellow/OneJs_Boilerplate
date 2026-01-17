import { View, Text, StyleSheet } from 'react-native'
import { useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { WebView } from 'react-native-webview'
import type { WebViewMessageEvent } from 'react-native-webview'
import { colors } from '@/theme/colors'
import { devLog } from '@/utils/logger'
import type { SectorUI } from '@/types/ui'

interface ExplorerMapViewProps {
  /** List of sectors to display as markers */
  sectors: SectorUI[]
  /** User's current location */
  userLocation: { latitude: number; longitude: number } | null
  /** Callback when a sector marker is pressed */
  onSectorPress: (sectorId: string, sectorName: string) => void
  /** Search radius in km to calculate zoom level */
  searchRadiusKm?: number
}

interface SectorMarker {
  id: string
  name: string
  latitude: number
  longitude: number
  distanceKm: number
  routeCount: number
}

/**
 * Filter sectors that have valid coordinates
 */
export function filterSectorsWithCoordinates(sectors: SectorUI[]): SectorUI[] {
  return sectors.filter(
    (sector) => sector.latitude != null && sector.longitude != null,
  )
}

/**
 * Calculate zoom level based on search radius
 * OpenStreetMap uses zoom levels 0-18
 */
export function calculateZoomLevel(radiusKm: number): number {
  // Approximate zoom levels for different radii
  if (radiusKm <= 5) return 13
  if (radiusKm <= 10) return 12
  if (radiusKm <= 25) return 11
  if (radiusKm <= 50) return 10
  if (radiusKm <= 100) return 9
  return 8
}

interface MapTranslations {
  yourLocation: string
  routes: string
  viewSector: string
}

/**
 * Generate Leaflet HTML for OpenStreetMap
 */
function generateMapHtml(
  userLocation: { latitude: number; longitude: number },
  markers: SectorMarker[],
  zoomLevel: number,
  translations: MapTranslations,
): string {
  const markersJson = JSON.stringify(markers)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .sector-popup {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .sector-popup h3 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    .sector-popup p {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #666;
    }
    .sector-popup button {
      background: ${colors.accent.DEFAULT};
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
    }
    .user-marker {
      background: ${colors.status.info};
      border: 3px solid white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const userLocation = [${userLocation.latitude}, ${userLocation.longitude}];
    const markers = ${markersJson};
    const zoomLevel = ${zoomLevel};

    // Initialize map
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView(userLocation, zoomLevel);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Custom user location marker
    const userIcon = L.divIcon({
      className: 'user-marker-container',
      html: '<div class="user-marker"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    L.marker(userLocation, { icon: userIcon })
      .addTo(map)
      .bindPopup('${translations.yourLocation}');

    // Sector marker icon
    const sectorIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Add sector markers
    markers.forEach(sector => {
      const popupContent = \`
        <div class="sector-popup">
          <h3>\${sector.name}</h3>
          <p>\${sector.distanceKm.toFixed(1)} km • \${sector.routeCount} ${translations.routes}</p>
          <button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'sectorPress', id:'\${sector.id}', name:'\${sector.name}'}))">
            ${translations.viewSector}
          </button>
        </div>
      \`;

      L.marker([sector.latitude, sector.longitude], { icon: sectorIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    // Fit bounds to show all markers if there are any
    if (markers.length > 0) {
      const allPoints = [userLocation, ...markers.map(m => [m.latitude, m.longitude])];
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: zoomLevel });
    }
  </script>
</body>
</html>
`
}

/**
 * Map view component using OpenStreetMap with Leaflet
 * Shows user location and sector markers with popups
 */
export function ExplorerMapView({
  sectors,
  userLocation,
  onSectorPress,
  searchRadiusKm = 50,
}: ExplorerMapViewProps) {
  const { t } = useTranslation()
  const webViewRef = useRef<WebView>(null)

  const sectorsWithCoordinates = useMemo(
    () => filterSectorsWithCoordinates(sectors),
    [sectors],
  )

  const markers: SectorMarker[] = useMemo(
    () =>
      sectorsWithCoordinates.map((sector) => ({
        id: sector.id,
        name: sector.name,
        latitude: sector.latitude!,
        longitude: sector.longitude!,
        distanceKm: sector.distanceKm ?? 0,
        routeCount: sector.routeCount,
      })),
    [sectorsWithCoordinates],
  )

  const zoomLevel = useMemo(
    () => calculateZoomLevel(searchRadiusKm),
    [searchRadiusKm],
  )

  const mapTranslations: MapTranslations = useMemo(
    () => ({
      yourLocation: t('explorer.yourLocation'),
      routes: t('sector.routes'),
      viewSector: t('explorer.viewSector'),
    }),
    [t],
  )

  const mapHtml = useMemo(() => {
    if (!userLocation) return ''
    return generateMapHtml(userLocation, markers, zoomLevel, mapTranslations)
  }, [userLocation, markers, zoomLevel, mapTranslations])

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data)
        if (data.type === 'sectorPress') {
          onSectorPress(data.id, data.name)
        }
      } catch (error) {
        devLog.warn('Failed to parse WebView message:', error)
      }
    },
    [onSectorPress],
  )

  if (!userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('explorer.loadingMap')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
})
