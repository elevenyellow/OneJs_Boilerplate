import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, OrientationGradients } from '@/constants/Colors';

interface OrientationToggleProps {
  label: string;
  value: 'sun' | 'shade' | 'any';
  onChange: (value: 'sun' | 'shade' | 'any') => void;
}

export function OrientationToggle({ label, value, onChange }: OrientationToggleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const options: Array<{
    value: 'sun' | 'shade' | 'any';
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    gradientKey: 'sun' | 'shade' | 'neutral';
  }> = [
    { value: 'sun', label: 'Sol', icon: 'sunny', gradientKey: 'sun' },
    { value: 'shade', label: 'Sombra', icon: 'moon', gradientKey: 'shade' },
    { value: 'any', label: 'Cualquiera', icon: 'partly-sunny', gradientKey: 'neutral' },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.toggleContainer}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const gradient = OrientationGradients[option.gradientKey][colorScheme];
          
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.optionWrapper,
                pressed && styles.optionPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(option.value);
              }}
            >
              {isSelected ? (
                <LinearGradient
                  colors={gradient as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.option}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={option.icon}
                      size={32}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={[styles.optionText, { color: '#FFFFFF' }]}>
                    {option.label}
                  </Text>
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
                  </View>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.option,
                    styles.optionUnselected,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.iconContainer, styles.iconContainerUnselected]}>
                    <Ionicons
                      name={option.icon}
                      size={28}
                      color={colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.optionText, { color: colors.textSecondary }]}>
                    {option.label}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionWrapper: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  optionPressed: {
    transform: [{ scale: 0.96 }],
  },
  option: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 8,
    minHeight: 110,
  },
  optionUnselected: {
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerUnselected: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
