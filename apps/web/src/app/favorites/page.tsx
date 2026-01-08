'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZoneCard } from '@/components/zones/ZoneCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { api, type Zone } from '@/lib/api';

export default function FavoritesPage() {
  const { favorites, isLoaded } = useFavorites();
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch zone details for favorites
  useEffect(() => {
    if (!isLoaded) return;

    if (favorites.length === 0) {
      setZones([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all(favorites.map((id) => api.zones.getById(id).catch(() => null)))
      .then((results) => {
        const validZones = results.filter((z): z is Zone => z !== null);
        setZones(validZones);
      })
      .finally(() => setIsLoading(false));
  }, [favorites, isLoaded]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <Heart className="h-5 w-5 text-red-500" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Mis favoritos</h1>
        </div>
        <p className="text-muted-foreground">
          {zones.length} {zones.length === 1 ? 'zona guardada' : 'zonas guardadas'}
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      ) : zones.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-xl font-semibold mb-2">
            No tienes zonas favoritas
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Explora las zonas de escalada y guarda tus favoritas para acceder rápidamente a ellas.
          </p>
          <Link href="/zones">
            <Button className="gap-2">
              Explorar zonas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} />
          ))}
        </div>
      )}
    </div>
  );
}




