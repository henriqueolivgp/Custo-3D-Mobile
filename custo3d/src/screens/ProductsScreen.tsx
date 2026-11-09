import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { productBreakdown } from '../lib/calc';
import { formatDuration, formatMoney } from '../lib/format';
import { useStore } from '../store/appStore';
import { colors, radius, space, typo } from '../theme';
import type { Product, Settings, Spool } from '../types';
import { Reveal } from '../ui/motion';
import { ScreenHeader } from '../ui/Page';
import { Button, EmptyState, IconButton, Tap } from '../ui/primitives';
import { SpoolDisc } from '../ui/SpoolDisc';

type RowProps = {
  product: Product;
  index: number;
  spools: Map<string, Spool>;
  settings: Settings;
  onPress: (id: string) => void;
};

const OVERLAP = 16;
const DISC = 38;

const ProductRow = memo(function ProductRow({ product, index, spools, settings, onPress }: RowProps) {
  const b = useMemo(() => productBreakdown(product, spools, settings), [product, spools, settings]);
  const shown = product.materials.slice(0, 3);
  return (
    <Reveal index={index}>
      <Tap onPress={() => onPress(product.id)} accessibilityLabel={`${product.name}, ${formatMoney(b.price)}. Editar produto`} style={styles.row}>
        <View style={{ width: DISC + (shown.length - 1) * OVERLAP, height: DISC }}>
          {shown.map((m, i) => (
            <View key={m.id} style={{ position: 'absolute', left: i * OVERLAP, zIndex: shown.length - i }}>
              <SpoolDisc color={spools.get(m.spoolId)?.colorHex ?? colors.muted} size={DISC} />
            </View>
          ))}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={typo.bodyStrong} numberOfLines={1}>{product.name}</Text>
          {product.description ? <Text style={typo.caption} numberOfLines={1}>{product.description}</Text> : null}
          <View style={styles.time}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={typo.caption}>{formatDuration(product.printMinutes)}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[typo.bodyStrong, typo.number, { color: colors.price, fontSize: 18 }]}>{formatMoney(b.price)}</Text>
          <Text style={[typo.caption, typo.number]}>custo {formatMoney(b.cost)}</Text>
        </View>
      </Tap>
    </Reveal>
  );
});

type Props = { onAdd: () => void; onEdit: (id: string) => void; onAddSpool: () => void };

export function ProductsScreen({ onAdd, onEdit, onAddSpool }: Props) {
  const products = useStore((s) => s.products);
  const spools = useStore((s) => s.spools);
  const settings = useStore((s) => s.settings);
  const spoolMap = useMemo(() => new Map(spools.map((s) => [s.id, s])), [spools]);
  const hasSpools = spools.length > 0;

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Product>) => (
      <ProductRow product={item} index={index} spools={spoolMap} settings={settings} onPress={onEdit} />
    ),
    [spoolMap, settings, onEdit],
  );

  const subtitle = products.length === 0 ? undefined : `${products.length} ${products.length === 1 ? 'produto guardado' : 'produtos guardados'}`;

  return (
    <View style={styles.fill}>
      <ScreenHeader title="Produtos" subtitle={subtitle}
        right={<IconButton icon="add" label="Criar produto" filled disabled={!hasSpools} onPress={onAdd} />} />
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        windowSize={7}
        ListEmptyComponent={
          hasSpools ? (
            <EmptyState
              icon="cube-outline"
              title="Ainda sem produtos"
              text="Cria um produto com os materiais, as gramas e o tempo de impressão. O preço é calculado na hora e fica guardado."
              action={<Button label="Criar produto" icon="add" onPress={onAdd} />}
            />
          ) : (
            <EmptyState
              icon="disc-outline"
              title="Primeiro, regista uma bobine"
              text="Os produtos usam as bobines registadas para calcular o custo do material."
              action={<Button label="Registar bobine" icon="add" onPress={onAddSpool} />}
            />
          )
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
  time: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
});
