import { memo, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { costPerGram } from '../lib/calc';
import { formatMoney, formatNumber } from '../lib/format';
import { useStore } from '../store/appStore';
import { colors, radius, space, typo } from '../theme';
import type { Spool } from '../types';
import { Reveal } from '../ui/motion';
import { ScreenHeader } from '../ui/Page';
import { Button, EmptyState, IconButton, Tap } from '../ui/primitives';
import { SpoolDisc } from '../ui/SpoolDisc';

type RowProps = { spool: Spool; index: number; onPress: (id: string) => void };

const SpoolRow = memo(function SpoolRow({ spool, index, onPress }: RowProps) {
  const perKg = costPerGram(spool) * 1000;
  return (
    <Reveal index={index}>
      <Tap onPress={() => onPress(spool.id)} accessibilityLabel={`${spool.colorName} ${spool.type}. Editar bobine`} style={styles.row}>
        <SpoolDisc color={spool.colorHex} size={54} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={typo.bodyStrong} numberOfLines={1}>{spool.colorName}</Text>
          <View style={styles.meta}>
            <View style={styles.typePill}>
              <Text style={styles.typeText}>{spool.type}</Text>
            </View>
            <Text style={typo.caption}>{formatNumber(spool.weightG, spool.weightG % 1 ? 1 : 0)} g</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[typo.bodyStrong, typo.number]}>{formatMoney(perKg)}</Text>
          <Text style={typo.caption}>por kg</Text>
        </View>
      </Tap>
    </Reveal>
  );
});

export function SpoolsScreen({ onAdd, onEdit }: { onAdd: () => void; onEdit: (id: string) => void }) {
  const spools = useStore((s) => s.spools);
  const subtitle = useMemo(() => {
    if (spools.length === 0) return undefined;
    const kg = spools.reduce((sum, s) => sum + s.weightG, 0) / 1000;
    return `${spools.length} ${spools.length === 1 ? 'bobine' : 'bobines'}, ${formatNumber(kg, 1)} kg de fio`;
  }, [spools]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Spool>) => <SpoolRow spool={item} index={index} onPress={onEdit} />,
    [onEdit],
  );

  return (
    <View style={styles.fill}>
      <ScreenHeader title="Bobines" subtitle={subtitle} right={<IconButton icon="add" label="Adicionar bobine" filled onPress={onAdd} />} />
      <FlatList
        data={spools}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        windowSize={7}
        ListEmptyComponent={
          <EmptyState
            icon="disc-outline"
            title="Ainda não registaste bobines"
            text="Regista a cor, o tipo, o peso e o preço que pagaste. Com isso calculo o custo de cada grama."
            action={<Button label="Registar bobine" icon="add" onPress={onAdd} />}
          />
        }
      />
    </View>
  );
}

const Separator = () => <View style={{ height: space.sm + 2 }} />;

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: space.xl, paddingBottom: space.xl, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surfaceHi },
  typeText: { fontSize: 12, fontWeight: '700', color: colors.text },
});
