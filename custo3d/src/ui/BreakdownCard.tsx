import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { Breakdown } from '../lib/calc';
import { formatMoney } from '../lib/format';
import { colors, radius, space, typo } from '../theme';
import { Card } from './primitives';
import { useReduceMotion } from './motion';

const PARTS = [
  { key: 'material', label: 'Material', color: '#8AA4FF' },
  { key: 'energy', label: 'Eletricidade', color: '#5BD6A1' },
  { key: 'wear', label: 'Desgaste da máquina', color: '#C792EA' },
  { key: 'failures', label: 'Margem para falhas', color: '#FF9F6B' },
  { key: 'packaging', label: 'Embalagem', color: '#8B98AC' },
] as const;

/** Mostra de onde vem o custo (barra proporcional) e o preço final. A barra cresce uma vez ao aparecer. */
export function BreakdownCard({ breakdown: b, marginPct }: { breakdown: Breakdown; marginPct: number }) {
  const reduce = useReduceMotion();
  const grow = useRef(new Animated.Value(reduce ? 1 : 0.02)).current;
  useEffect(() => {
    if (reduce) {
      grow.setValue(1);
      return;
    }
    const anim = Animated.timing(grow, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [reduce, grow]);

  return (
    <Card style={{ gap: space.md }}>
      <Animated.View style={[styles.bar, { transformOrigin: 'left center', transform: [{ scaleX: grow }] }]}>
        {PARTS.map((p) => (b[p.key] > 0 ? <View key={p.key} style={{ flex: b[p.key], backgroundColor: p.color }} /> : null))}
      </Animated.View>

      {PARTS.map((p) => (
        <View key={p.key} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: p.color }]} />
          <Text style={[typo.body, { flex: 1 }]}>{p.label}</Text>
          <Text style={[typo.body, typo.number]}>{formatMoney(b[p.key])}</Text>
        </View>
      ))}

      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={[typo.bodyStrong, { flex: 1 }]}>Custo total</Text>
        <Text style={[typo.bodyStrong, typo.number]}>{formatMoney(b.cost)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[typo.body, { flex: 1 }]}>Margem de lucro ({marginPct.toString().replace('.', ',')}%)</Text>
        <Text style={[typo.body, typo.number, { color: colors.ok }]}>+ {formatMoney(b.profit)}</Text>
      </View>

      <View style={styles.final}>
        <Text style={typo.label}>Preço de venda</Text>
        <Text style={typo.price} accessibilityLabel={`Preço de venda ${formatMoney(b.price)}`}>{formatMoney(b.price)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: { height: 12, borderRadius: radius.pill, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.surfaceHi },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  divider: { height: 1, backgroundColor: colors.line },
  final: { alignItems: 'flex-start', gap: 2, paddingTop: space.xs },
});
