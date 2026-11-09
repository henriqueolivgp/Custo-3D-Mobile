import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space } from '../theme';
import { Tap } from './primitives';
import type { IconName } from './primitives';

export type TabKey = 'spools' | 'products' | 'settings';

const TABS: { key: TabKey; label: string; icon: IconName; iconOn: IconName }[] = [
  { key: 'spools', label: 'Bobines', icon: 'disc-outline', iconOn: 'disc' },
  { key: 'products', label: 'Produtos', icon: 'cube-outline', iconOn: 'cube' },
  { key: 'settings', label: 'Definições', icon: 'options-outline', iconOn: 'options' },
];

export function TabBar({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Tap
            key={t.key}
            onPress={() => onChange(t.key)}
            accessibilityLabel={t.label}
            scaleTo={0.94}
            containerStyle={{ flex: 1 }}
            style={styles.item}
          >
            <View style={[styles.pill, on && styles.pillOn]}>
              <Ionicons name={on ? t.iconOn : t.icon} size={22} color={on ? colors.accent : colors.muted} />
            </View>
            <Text style={[styles.label, { color: on ? colors.text : colors.muted }]}>{t.label}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: space.sm,
  },
  item: { alignItems: 'center', gap: 2 },
  pill: { width: 60, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.surfaceHi },
  label: { fontSize: 12, fontWeight: '600' },
});
