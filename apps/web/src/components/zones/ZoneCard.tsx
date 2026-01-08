'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Route, Mountain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDistance } from '@/lib/utils';
import type { Zone } from '@/lib/api';

interface ZoneCardProps {
  zone: Zone;
  className?: string;
}

const climbingTypeLabels: Record<string, string> = {
  sport: 'Deportiva',
  trad: 'Clásica',
  boulder: 'Boulder',
  'multi-pitch': 'Largo',
  mixed: 'Mixta',
};

export function ZoneCard({ zone, className }: ZoneCardProps) {
  return (
    <Link href={`/zones/${zone.id}`}>
      <Card className={cn('overflow-hidden group cursor-pointer', className)}>
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          {zone.imageUrl ? (
            <Image
              src={zone.imageUrl}
              alt={zone.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Mountain className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Distance badge */}
          {zone.distance !== undefined && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium">
              {formatDistance(zone.distance)}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title & Location */}
          <h3 className="font-heading text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {zone.name}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{zone.region}, {zone.country}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Route className="h-4 w-4" />
              <span>{zone.totalRoutes} vías</span>
            </div>
          </div>

          {/* Climbing types */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {zone.climbingTypes.slice(0, 3).map((type) => (
              <Badge 
                key={type} 
                variant={type as any}
                className="text-xs"
              >
                {climbingTypeLabels[type] || type}
              </Badge>
            ))}
            {zone.climbingTypes.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{zone.climbingTypes.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}




