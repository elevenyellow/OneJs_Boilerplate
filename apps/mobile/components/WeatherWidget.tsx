import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, ConditionColors } from '@/constants/Colors';
import type { DailyForecast } from '@/lib/api';

interface WeatherWidgetProps {
  forecast: DailyForecast[] | null;
  isLoading?: boolean;
}

const weatherIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  sunny: 'sunny',
  'partly-cloudy': 'partly-sunny',
  cloudy: 'cloudy',
  overcast: 'cloudy',
  'light-rain': 'rainy',
  rain: 'rainy',
  'heavy-rain': 'thunderstorm',
  thunderstorm: 'thunderstorm',
  snow: 'snow',
  fog: 'cloudy',
  windy: 'leaf',
};

const climbingConditionLabels: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  unsuitable: 'Unsuitable',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
  });
}

export function WeatherWidget({ forecast, isLoading }: WeatherWidgetProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Loading forecast...</Text>
      </View>
    );
  }

  if (!forecast || forecast.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Forecast not available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="thermometer-outline" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>5-day forecast</Text>
      </View>

      {forecast.slice(0, 5).map((day, index) => {
        const conditionColor = ConditionColors[day.climbingCondition as keyof typeof ConditionColors];
        const iconName = weatherIcons[day.condition] || 'cloudy';

        return (
          <View
            key={day.date}
            style={[
              styles.dayRow,
              index === 0 && { backgroundColor: colors.muted },
              index !== forecast.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
            ]}
          >
            <View style={styles.dayLeft}>
              <Ionicons name={iconName} size={28} color={colors.textSecondary} />
              <View>
                <Text style={[styles.dayName, { color: colors.text }]}>
                  {index === 0 ? 'Today' : formatDate(day.date)}
                </Text>
                <View style={styles.dayStats}>
                  <Ionicons name="water-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.dayStatText, { color: colors.textSecondary }]}>
                    {day.precipitationProbability}%
                  </Text>
                  <Ionicons name="leaf-outline" size={12} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                  <Text style={[styles.dayStatText, { color: colors.textSecondary }]}>
                    {day.windSpeed} km/h
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dayRight}>
              <Text style={[styles.tempText, { color: colors.text }]}>
                {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
              </Text>
              <View
                style={[
                  styles.conditionBadge,
                  { backgroundColor: conditionColor?.[colorScheme] ?? colors.muted },
                ]}
              >
                <Text style={styles.conditionText}>
                  {climbingConditionLabels[day.climbingCondition]}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayStatText: {
    fontSize: 12,
  },
  dayRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tempText: {
    fontSize: 14,
    fontWeight: '600',
  },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});




