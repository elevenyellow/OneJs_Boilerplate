import { Sun, Cloud, CloudRain, CloudSnow, Wind, CloudFog, CloudLightning } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherIconProps {
  condition: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sunny: Sun,
  'partly-cloudy': Cloud,
  cloudy: Cloud,
  overcast: Cloud,
  'light-rain': CloudRain,
  rain: CloudRain,
  'heavy-rain': CloudRain,
  thunderstorm: CloudLightning,
  snow: CloudSnow,
  fog: CloudFog,
  windy: Wind,
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

const colorClasses: Record<string, string> = {
  sunny: 'text-yellow-500',
  'partly-cloudy': 'text-gray-400',
  cloudy: 'text-gray-500',
  overcast: 'text-gray-600',
  'light-rain': 'text-blue-400',
  rain: 'text-blue-500',
  'heavy-rain': 'text-blue-600',
  thunderstorm: 'text-purple-500',
  snow: 'text-cyan-300',
  fog: 'text-gray-400',
  windy: 'text-teal-500',
};

export function WeatherIcon({ condition, className, size = 'md' }: WeatherIconProps) {
  const Icon = iconMap[condition] || Cloud;
  
  return (
    <Icon 
      className={cn(
        sizeClasses[size],
        colorClasses[condition] || 'text-muted-foreground',
        className
      )} 
    />
  );
}




