import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, radius, space, typo } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type TapProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  scaleTo?: number;
};

/** Pressable com feedback de escala feito na thread nativa (não pesa no JS). */
export function Tap({ children, onPress, disabled, style, containerStyle, accessibilityLabel, scaleTo = 0.97 }: TapProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={containerStyle}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'soft' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, containerStyle }: ButtonProps) {
  const bg = variant === 'primary' ? colors.accent : variant === 'danger' ? 'transparent' : colors.surfaceHi;
  const fg = variant === 'primary' ? colors.accentInk : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      containerStyle={containerStyle}
      accessibilityLabel={label}
      style={[
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'danger' ? colors.danger : 'transparent', opacity: disabled ? 0.45 : 1 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={[typo.bodyStrong, { color: fg }]}>{label}</Text>
    </Tap>
  );
}

export function IconButton({ icon, onPress, label, color = colors.text, filled, disabled }: {
  icon: IconName; onPress: () => void; label: string; color?: string; filled?: boolean; disabled?: boolean;
}) {
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      scaleTo={0.9}
      style={[styles.iconButton, filled && { backgroundColor: colors.accent }, disabled && { opacity: 0.4 }]}
    >
      <Ionicons name={icon} size={24} color={filled ? colors.accentInk : color} />
    </Tap>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={label}
      scaleTo={0.94}
      style={[styles.chip, selected && { backgroundColor: colors.accent, borderColor: colors.accent }]}
    >
      <Text style={[typo.bodyStrong, { fontSize: 14, color: selected ? colors.accentInk : colors.text }]}>{label}</Text>
    </Tap>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={[typo.heading, { fontSize: 17, marginTop: space.xl, marginBottom: space.sm }]}>{children}</Text>;
}

export function EmptyState({ icon, title, text, action }: {
  icon: IconName; title: string; text: string; action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={colors.accent} />
      </View>
      <Text style={[typo.heading, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[typo.caption, { textAlign: 'center', fontSize: 15, lineHeight: 21, maxWidth: 300 }]}>{text}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chip: {
    paddingHorizontal: space.lg,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
  },
  empty: { alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingTop: space.xxl * 2 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
});
