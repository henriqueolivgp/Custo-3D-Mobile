import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { costPerGram } from '../lib/calc';
import { formatMoney } from '../lib/format';
import { colors, radius, space, typo } from '../theme';
import type { Spool } from '../types';
import { SpoolDisc } from './SpoolDisc';
import { Tap } from './primitives';

type Props = {
  visible: boolean;
  spools: Spool[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function SpoolPicker({ visible, spools, selectedId, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <View style={styles.grabber} />
          <Text style={[typo.heading, { marginBottom: space.md }]}>Escolher bobine</Text>
          {spools.length === 0 ? (
            <Text style={[typo.caption, { fontSize: 15, lineHeight: 21 }]}>
              Ainda não tens bobines registadas. Regista uma no separador Bobines.
            </Text>
          ) : (
            <FlatList
              data={spools}
              keyExtractor={(s) => s.id}
              style={{ maxHeight: 420 }}
              ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
              renderItem={({ item }) => (
                <Tap onPress={() => onSelect(item.id)} accessibilityLabel={`${item.colorName} ${item.type}`} style={styles.row}>
                  <SpoolDisc color={item.colorHex} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={typo.bodyStrong} numberOfLines={1}>{item.colorName}</Text>
                    <Text style={typo.caption}>{item.type}, {formatMoney(costPerGram(item) * 1000)} por kg</Text>
                  </View>
                  {item.id === selectedId ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
                </Tap>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHi,
  },
});
