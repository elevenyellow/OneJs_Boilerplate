'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ZoneList } from '@/components/zones/ZoneList';
import { ZoneFilters } from '@/components/zones/ZoneFilters';
import { ZoneMap } from '@/components/map/ZoneMap';
import { Button } from '@/components/ui/button';
import { useZones, useCountries } from '@/hooks/useZones';
import { Map, List } from 'lucide-react';
import type { ZoneFilters as ZoneFiltersType } from '@/lib/api';

export default function ZonesPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState<ZoneFiltersType>(() => {
    const type = searchParams.get('type');
    return {
      climbingTypes: type ? [type] : undefined,
      search: searchParams.get('search') || undefined,
      country: searchParams.get('country') || undefined,
    };
  });

  const { data: zones, isLoading } = useZones(filters);
  const { data: countries } = useCountries();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Zonas de escalada</h1>
          <p className="text-muted-foreground mt-1">
            {zones?.length ?? 0} zonas encontradas
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Lista
          </Button>
          <Button
            variant={viewMode === 'map' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="gap-2"
          >
            <Map className="h-4 w-4" />
            Mapa
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <ZoneFilters
          filters={filters}
          onFiltersChange={setFilters}
          countries={countries}
        />
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <ZoneList zones={zones || []} isLoading={isLoading} />
      ) : (
        <ZoneMap 
          zones={zones || []} 
          className="h-[600px] rounded-xl"
        />
      )}
    </div>
  );
}




