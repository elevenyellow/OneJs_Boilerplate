'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mountain, MapPin, Compass, ArrowRight, Cloud, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ZoneMap } from '@/components/map/ZoneMap';
import { ZoneCard } from '@/components/zones/ZoneCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useZones, useNearbyZones } from '@/hooks/useZones';
import type { Zone } from '@/lib/api';

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: allZones, isLoading: zonesLoading } = useZones({ limit: 50 });
  const { data: nearbyZones } = useNearbyZones(
    userLocation?.lat ?? 0,
    userLocation?.lng ?? 0,
    100,
    !!userLocation
  );

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      () => {
        setIsGettingLocation(false);
        alert('No se pudo obtener tu ubicación');
      }
    );
  };

  const displayZones = nearbyZones || allZones || [];
  const featuredZones = displayZones.slice(0, 4);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Mountain className="h-4 w-4" />
                Tu próxima aventura te espera
              </div>
              
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Descubre las mejores{' '}
                <span className="text-primary">zonas de escalada</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Explora cientos de zonas de escalada con información detallada y 
                pronósticos meteorológicos para planificar tu próxima salida.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/zones">
                  <Button size="lg" className="gap-2">
                    <Compass className="h-4 w-4" />
                    Explorar zonas
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                >
                  <MapPin className="h-4 w-4" />
                  {isGettingLocation ? 'Obteniendo ubicación...' : 'Zonas cercanas'}
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold font-heading">500+</p>
                  <p className="text-sm text-muted-foreground">Zonas</p>
                </div>
                <div>
                  <p className="text-3xl font-bold font-heading">10k+</p>
                  <p className="text-sm text-muted-foreground">Vías</p>
                </div>
                <div>
                  <p className="text-3xl font-bold font-heading">15</p>
                  <p className="text-sm text-muted-foreground">Países</p>
                </div>
              </div>
            </div>

            {/* Map preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-2xl opacity-50" />
              <ZoneMap 
                zones={displayZones} 
                className="h-[400px] lg:h-[500px] relative z-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-secondary/20">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Zonas cercanas</h3>
              <p className="text-muted-foreground">
                Encuentra zonas de escalada cerca de ti con información detallada de cada sector.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-secondary/20">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Cloud className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Pronósticos</h3>
              <p className="text-muted-foreground">
                Consulta el tiempo para cada zona y planifica tu día de escalada perfecto.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-secondary/20">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Route className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Info completa</h3>
              <p className="text-muted-foreground">
                Datos de vías, grados, tipos de escalada y más para cada zona.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Zones */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold">
              {nearbyZones ? 'Zonas cercanas' : 'Zonas destacadas'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {nearbyZones 
                ? 'Las mejores zonas cerca de tu ubicación' 
                : 'Algunas de las zonas más populares'}
            </p>
          </div>
          <Link href="/zones">
            <Button variant="outline" className="gap-2">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {zonesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredZones.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}




