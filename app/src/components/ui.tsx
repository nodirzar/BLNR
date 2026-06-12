import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { palette, radius, spacing } from '@/lib/theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
      ]}
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 42 }}>{emoji}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.ink,
    paddingHorizontal: spacing(5),
  },
  title: {
    color: palette.cream,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: spacing(4),
  },
  subtitle: {
    color: palette.muted,
    fontSize: 15,
    marginTop: spacing(1),
    marginBottom: spacing(4),
  },
  chip: {
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.charcoal,
    marginRight: spacing(2),
    marginBottom: spacing(2),
  },
  chipActive: {
    backgroundColor: palette.terracotta,
    borderColor: palette.terracotta,
  },
  chipText: { color: palette.sand, fontSize: 14 },
  chipTextActive: { color: palette.ink, fontWeight: '600' },
  button: {
    backgroundColor: palette.terracotta,
    borderRadius: radius.md,
    paddingVertical: spacing(4),
    alignItems: 'center',
  },
  buttonText: { color: palette.ink, fontSize: 16, fontWeight: '700' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(16),
    gap: spacing(3),
  },
  emptyText: {
    color: palette.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
