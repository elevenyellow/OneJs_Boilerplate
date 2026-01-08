'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Zone } from '@/lib/api';

// Dynamic import for Leaflet (SSR not supported)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface ZoneMapProps {
  zones: Zone[];
  center?: [number, number];
  zoom?: number;
  onZoneSelect?: (zone: Zone) => void;
  className?: string;
}

export function ZoneMap({ 
  zones, 
  center = [40.4168, -3.7038], // Madrid as default
  zoom = 6,
  onZoneSelect,
  className = 'h-[500px] w-full'
}: ZoneMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [icon, setIcon] = useState<L.Icon | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Import Leaflet and create custom icon
    import('leaflet').then((L) => {
      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Custom climbing icon
      const customIcon = new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      setIcon(customIcon);
    });
  }, []);

  if (!isClient) {
    return (
      <div className={`${className} bg-muted rounded-xl flex items-center justify-center`}>
        <p className="text-muted-foreground">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-xl overflow-hidden border border-border`}>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map((zone) => (
          icon && (
            <Marker
              key={zone.id}
              position={[zone.coordinates.latitude, zone.coordinates.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onZoneSelect?.(zone),
              }}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-semibold text-base">{zone.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {zone.region}, {zone.country}
                  </p>
                  <p className="text-sm mt-1">
                    {zone.totalRoutes} vías
                  </p>
                  <a
                    href={`/zones/${zone.id}`}
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    Ver detalles →
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}




