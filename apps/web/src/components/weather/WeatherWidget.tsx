'use client';

import { Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets, ThermometerSun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTemperature, formatDate } from '@/lib/utils';
import type { DailyForecast } from '@/lib/api';

interface WeatherWidgetProps {
  forecast: DailyForecast[] | null;
  isLoading?: boolean;
}

const weatherIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  sunny: Sun,
  'partly-cloudy': Cloud,
  cloudy: Cloud,
  overcast: Cloud,
  'light-rain': CloudRain,
  rain: CloudRain,
  'heavy-rain': CloudRain,
  thunderstorm: CloudRain,
  snow: CloudSnow,
  fog: Cloud,
  windy: Wind,
};

const climbingConditionLabels: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  fair: 'Aceptable',
  poor: 'Malo',
  unsuitable: 'No apto',
};

function DayForecast({ day, isToday }: { day: DailyForecast; isToday?: boolean }) {
  const WeatherIcon = weatherIcons[day.condition] || Cloud;

  return (
    <div className={`flex items-center justify-between py-3 ${isToday ? 'bg-secondary/50 -mx-4 px-4 rounded-lg' : ''}`}>
      <div className="flex items-center gap-3">
        <WeatherIcon className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="font-medium">
            {isToday ? 'Hoy' : formatDate(day.date)}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              {day.precipitationProbability}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              {day.windSpeed} km/h
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-medium">
            {formatTemperature(day.tempMax)} / {formatTemperature(day.tempMin)}
          </p>
        </div>
        <Badge variant={day.climbingCondition as any} className="min-w-[80px] justify-center">
          {climbingConditionLabels[day.climbingCondition]}
        </Badge>
      </div>
    </div>
  );
}

export function WeatherWidget({ forecast, isLoading }: WeatherWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!forecast || forecast.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThermometerSun className="h-5 w-5" />
            Pronóstico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No hay datos meteorológicos disponibles para esta zona.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ThermometerSun className="h-5 w-5" />
          Pronóstico 5 días
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {forecast.slice(0, 5).map((day, index) => (
          <DayForecast key={day.date} day={day} isToday={index === 0} />
        ))}
      </CardContent>
    </Card>
  );
}




