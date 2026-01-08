'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, 
  Route, 
  Mountain, 
  ExternalLink, 
  Heart, 
  Share2, 
  ArrowLeft,
  Clock,
  Sunrise,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { ZoneMap } from '@/components/map/ZoneMap';
import { useZoneDetail } from '@/hooks/useZones';
import { useWeather } from '@/hooks/useWeather';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

const climbingTypeLabels: Record<string, string> = {
  sport: 'Deportiva',
  trad: 'Clásica',
  boulder: 'Boulder',
  'multi-pitch': 'Largo',
  mixed: 'Mixta',
};

interface ZoneDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ZoneDetailPage({ params }: ZoneDetailPageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const { data: zone, isLoading: zoneLoading } = useZoneDetail(id);
  const { data: weather, isLoading: weatherLoading } = useWeather(id);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (zoneLoading) {
    return <ZoneDetailSkeleton />;
  }

  if (!zone) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold">Zona no encontrada</h1>
        <p className="text-muted-foreground mt-2">
          La zona que buscas no existe o ha sido eliminada.
        </p>
        <Link href="/zones">
          <Button className="mt-4">Volver a zonas</Button>
        </Link>
      </div>
    );
  }

  const isFav = isFavorite(zone.id);

  return (
    <div className="flex flex-col">
      {/* Hero with image */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden bg-muted">
        {zone.imageUrl ? (
          <Image
            src={zone.imageUrl}
            alt={zone.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Mountain className="h-32 w-32 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Back button */}
        <Link href="/zones" className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button 
            variant="secondary" 
            size="icon"
            onClick={() => toggleFavorite(zone.id)}
            className={cn(isFav && 'text-red-500')}
          >
            <Heart className={cn('h-4 w-4', isFav && 'fill-current')} />
          </Button>
          <Button variant="secondary" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        {/* Title section */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold">{zone.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{zone.region}, {zone.country}</span>
              </div>
              
              {/* Climbing types */}
              <div className="flex flex-wrap gap-2 mt-4">
                {zone.climbingTypes.map((type) => (
                  <Badge key={type} variant={type as any}>
                    {climbingTypeLabels[type] || type}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <a href={zone.theCragUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2 w-full md:w-auto">
                  <ExternalLink className="h-4 w-4" />
                  Ver en theCrag
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-8 pb-16">
          {/* Left column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {zone.description || 'No hay descripción disponible para esta zona.'}
                </p>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-3xl font-bold font-heading">{zone.stats.totalRoutes}</p>
                    <p className="text-sm text-muted-foreground">Vías totales</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-heading">{zone.gradeRange.min}</p>
                    <p className="text-sm text-muted-foreground">Grado mínimo</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-heading">{zone.gradeRange.max}</p>
                    <p className="text-sm text-muted-foreground">Grado máximo</p>
                  </div>
                  {zone.altitude && (
                    <div>
                      <p className="text-2xl font-bold font-heading">{zone.altitude}m</p>
                      <p className="text-sm text-muted-foreground">Altitud</p>
                    </div>
                  )}
                </div>

                {/* Routes by type */}
                <Separator className="my-6" />
                <h4 className="font-medium mb-4">Vías por tipo</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(zone.stats.routesByType).map(([type, count]) => (
                    <div key={type} className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">
                        {climbingTypeLabels[type] || type}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Approach */}
            {zone.approach && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Compass className="h-5 w-5" />
                    Aproximación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {zone.approach}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Best seasons */}
            {zone.bestSeasons && zone.bestSeasons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sunrise className="h-5 w-5" />
                    Mejor época
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {zone.bestSeasons.map((season) => (
                      <Badge key={season} variant="secondary">
                        {season}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ZoneMap
                  zones={[zone]}
                  center={[zone.coordinates.latitude, zone.coordinates.longitude]}
                  zoom={12}
                  className="h-[300px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column - Weather */}
          <div className="space-y-6">
            <WeatherWidget 
              forecast={weather?.daily ?? null} 
              isLoading={weatherLoading} 
            />

            {/* Quick info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Info rápida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sistema de grados</span>
                  <span className="font-medium">{zone.gradeRange.system.toUpperCase()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordenadas</span>
                  <span className="font-mono text-xs">
                    {zone.coordinates.latitude.toFixed(4)}, {zone.coordinates.longitude.toFixed(4)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoneDetailSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-[400px] w-full" />
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-card rounded-xl border border-border p-6 shadow-lg mb-8">
          <Skeleton className="h-10 w-2/3 mb-4" />
          <Skeleton className="h-5 w-1/3 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}




