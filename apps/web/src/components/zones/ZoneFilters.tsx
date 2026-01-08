'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ZoneFilters as ZoneFiltersType } from '@/lib/api';

interface ZoneFiltersProps {
  filters: ZoneFiltersType;
  onFiltersChange: (filters: ZoneFiltersType) => void;
  countries?: string[];
}

const climbingTypes = [
  { value: 'sport', label: 'Deportiva' },
  { value: 'trad', label: 'Clásica' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'multi-pitch', label: 'Largo' },
  { value: 'mixed', label: 'Mixta' },
];

export function ZoneFilters({ filters, onFiltersChange, countries = [] }: ZoneFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue });
  };

  const toggleClimbingType = (type: string) => {
    const current = filters.climbingTypes || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, climbingTypes: updated.length > 0 ? updated : undefined });
  };

  const handleCountryChange = (country: string) => {
    onFiltersChange({ ...filters, country: country || undefined });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasActiveFilters = filters.search || filters.country || (filters.climbingTypes && filters.climbingTypes.length > 0);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar por nombre, región o país..."
            className="pl-10"
          />
        </div>
        <Button type="submit">Buscar</Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-secondary' : ''}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 border border-border rounded-lg bg-card space-y-4">
          {/* Climbing types */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de escalada</label>
            <div className="flex flex-wrap gap-2">
              {climbingTypes.map((type) => {
                const isActive = filters.climbingTypes?.includes(type.value);
                return (
                  <Badge
                    key={type.value}
                    variant={isActive ? (type.value as any) : 'outline'}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleClimbingType(type.value)}
                  >
                    {type.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Country select */}
          {countries.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">País</label>
              <select
                value={filters.country || ''}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">Todos los países</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Active filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Búsqueda: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ ...filters, search: undefined });
                }}
              />
            </Badge>
          )}
          {filters.country && (
            <Badge variant="secondary" className="gap-1">
              {filters.country}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, country: undefined })}
              />
            </Badge>
          )}
          {filters.climbingTypes?.map((type) => (
            <Badge key={type} variant={type as any} className="gap-1">
              {climbingTypes.find((t) => t.value === type)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleClimbingType(type)}
              />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );
}




