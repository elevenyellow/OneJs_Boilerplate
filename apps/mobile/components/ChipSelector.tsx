import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

interface ChipSelectorProps {
  label: string;
  options: { value: string; label: string; icon?: string }[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  multiSelect?: boolean;
}

export function ChipSelector({
  label,
  options,
  selectedValues,
  onSelectionChange,
  multiSelect = true,
}: ChipSelectorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handlePress = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (multiSelect) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onSelectionChange(newValues);
    } else {
      onSelectionChange([value]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.chipsContainer}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.chipWrapper,
                pressed && styles.chipPressed,
              ]}
              onPress={() => handlePress(option.value)}
            >
              {isSelected ? (
                <LinearGradient
                  colors={
                    colorScheme === 'dark'
                      ? [colors.primary, '#6366F1']
                      : [colors.primary, '#4338CA']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.chip}
                >
                  <View style={styles.checkContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.primaryForeground}
                    />
                  </View>
                  {option.icon && <Text style={styles.chipIcon}>{option.icon}</Text>}
                  <Text
                    style={[styles.chipText, { color: colors.primaryForeground }]}
                  >
                    {option.label}
                  </Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.chip,
                    styles.chipUnselected,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.checkContainer, styles.checkEmpty]}>
                    <View
                      style={[
                        styles.emptyCheck,
                        { borderColor: colors.border },
                      ]}
                    />
                  </View>
                  {option.icon && <Text style={styles.chipIcon}>{option.icon}</Text>}
                  <Text style={[styles.chipText, { color: colors.text }]}>
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipWrapper: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chipPressed: {
    transform: [{ scale: 0.96 }],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  chipUnselected: {
    borderWidth: 1.5,
  },
  checkContainer: {
    marginRight: 2,
  },
  checkEmpty: {
    opacity: 0.6,
  },
  emptyCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
