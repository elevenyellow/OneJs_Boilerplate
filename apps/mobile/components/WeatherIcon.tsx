import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface WeatherIconProps {
  condition: string;
  size?: number;
  animated?: boolean;
}

export function WeatherIcon({ condition, size = 40, animated = false }: WeatherIconProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { icon, color } = getWeatherIconData(condition, colorScheme);

  return (
    <Ionicons name={icon} size={size} color={color || colors.primary} />
  );
}

function getWeatherIconData(
  condition: string,
  colorScheme: 'light' | 'dark'
): { icon: keyof typeof Ionicons.glyphMap; color?: string } {
  const normalizedCondition = condition.toLowerCase();

  // Sunny/Clear
  if (normalizedCondition.includes('sun') || normalizedCondition.includes('clear')) {
    return { icon: 'sunny', color: '#FFA726' };
  }

  // Partly cloudy
  if (normalizedCondition.includes('partly') || normalizedCondition.includes('few')) {
    return { icon: 'partly-sunny', color: '#FFCA28' };
  }

  // Cloudy
  if (normalizedCondition.includes('cloud') || normalizedCondition.includes('overcast')) {
    return { icon: 'cloudy', color: '#90A4AE' };
  }

  // Rain
  if (normalizedCondition.includes('rain') || normalizedCondition.includes('drizzle')) {
    return { icon: 'rainy', color: '#42A5F5' };
  }

  // Thunderstorm
  if (normalizedCondition.includes('thunder') || normalizedCondition.includes('storm')) {
    return { icon: 'thunderstorm', color: '#5C6BC0' };
  }

  // Snow
  if (normalizedCondition.includes('snow')) {
    return { icon: 'snow', color: '#B0BEC5' };
  }

  // Fog/Mist
  if (
    normalizedCondition.includes('fog') ||
    normalizedCondition.includes('mist') ||
    normalizedCondition.includes('haze')
  ) {
    return { icon: 'cloudy', color: '#78909C' };
  }

  // Wind
  if (normalizedCondition.includes('wind')) {
    return { icon: 'leaf', color: '#66BB6A' };
  }

  // Default
  return { icon: 'partly-sunny', color: undefined };
}
