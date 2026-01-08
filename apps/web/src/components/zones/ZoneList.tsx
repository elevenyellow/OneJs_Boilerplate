'use client';

import { ZoneCard } from './ZoneCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Zone } from '@/lib/api';

interface ZoneListProps {
  zones: Zone[];
  isLoading?: boolean;
}

function ZoneCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ZoneList({ zones, isLoading }: ZoneListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ZoneCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">
          No se encontraron zonas con los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {zones.map((zone) => (
        <ZoneCard key={zone.id} zone={zone} />
      ))}
    </div>
  );
}




