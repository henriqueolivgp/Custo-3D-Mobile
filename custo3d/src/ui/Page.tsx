import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, typo } from '../theme';
import { IconButton } from './primitives';

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + space.lg }]}>
      <View style={{ flex: 1 }}>
        <Text style={typo.title} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={[typo.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/** Estrutura dos ecrãs de formulário: barra superior, conteúdo com scroll e rodapé fixo. */
export function PageShell({ title, onBack, right, footer, children }: {
  title: string; onBack: () => void; right?: ReactNode; footer?: ReactNode; children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <View style={[styles.bar, { paddingTop: insets.top + space.sm }]}>
        <IconButton icon="chevron-back" onPress={onBack} label="Voltar" />
        <Text style={[typo.heading, { flex: 1 }]} numberOfLines={1} accessibilityRole="header">{title}</Text>
        {right}
      </View>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>{footer}</View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
    gap: space.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    gap: space.xs,
    backgroundColor: colors.bg,
  },
  body: { paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.md },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: space.sm,
  },
});
