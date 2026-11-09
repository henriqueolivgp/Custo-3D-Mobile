import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { COLOR_PRESETS } from '../constants';
import { formatMoney, parseDecimal } from '../lib/format';
import { emptySpoolDraft, spoolToDraft, validateSpool } from '../lib/validation';
import type { SpoolDraft } from '../lib/validation';
import { store, useStore } from '../store/appStore';
import { colors, radius, space, typo } from '../theme';
import { FILAMENT_TYPES } from '../types';
import { Field } from '../ui/Field';
import { PageShell } from '../ui/Page';
import { Button, Card, Chip, IconButton, SectionTitle, Tap } from '../ui/primitives';

const QUICK_WEIGHTS = [250, 500, 750, 1000, 2000];

export function SpoolFormPage({ spoolId, onClose }: { spoolId?: string; onClose: () => void }) {
  const spools = useStore((s) => s.spools);
  const existing = useMemo(() => spools.find((s) => s.id === spoolId), [spools, spoolId]);
  const [draft, setDraft] = useState<SpoolDraft>(() => (existing ? spoolToDraft(existing) : emptySpoolDraft()));
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => validateSpool(draft), [draft]);
  const errors = submitted && !result.ok ? result.errors : undefined;
  const weight = parseDecimal(draft.weightG);
  const price = parseDecimal(draft.pricePaid);
  const perKg = weight && weight > 0 && price !== null ? (price / weight) * 1000 : null;

  const patch = (p: Partial<SpoolDraft>) => setDraft((d) => ({ ...d, ...p }));

  const pickColor = (preset: { name: string; hex: string }) =>
    setDraft((d) => {
      const untouched = d.colorName.trim() === '' || COLOR_PRESETS.some((c) => c.name === d.colorName);
      return { ...d, colorHex: preset.hex, colorName: untouched ? preset.name : d.colorName };
    });

  const save = () => {
    if (!result.ok) {
      setSubmitted(true);
      return;
    }
    store.saveSpool(result.value, existing?.id);
    onClose();
  };

  const remove = () => {
    if (!existing) return;
    const used = store.productsUsingSpool(existing.id);
    Alert.alert(
      'Apagar bobine?',
      used > 0
        ? `Esta bobine é usada em ${used} ${used === 1 ? 'produto' : 'produtos'}. Eles mantêm o último custo guardado.`
        : 'Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            store.removeSpool(existing.id);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <PageShell
      title={existing ? 'Editar bobine' : 'Nova bobine'}
      onBack={onClose}
      right={existing ? <IconButton icon="trash-outline" label="Apagar bobine" color={colors.danger} onPress={remove} /> : undefined}
      footer={<Button label={existing ? 'Guardar alterações' : 'Guardar bobine'} onPress={save} />}
    >
      <SectionTitle>Tipo de fio</SectionTitle>
      <View style={styles.wrap}>
        {FILAMENT_TYPES.map((t) => (
          <Chip key={t} label={t} selected={draft.type === t} onPress={() => patch({ type: t })} />
        ))}
      </View>

      <SectionTitle>Cor</SectionTitle>
      <View style={styles.wrap}>
        {COLOR_PRESETS.map((c) => {
          const on = c.hex === draft.colorHex;
          return (
            <Tap key={c.hex} onPress={() => pickColor(c)} accessibilityLabel={c.name} scaleTo={0.9}
              style={[styles.swatch, { backgroundColor: c.hex }, on && styles.swatchOn]}>
              {on ? <Ionicons name="checkmark" size={20} color={luminance(c.hex) > 0.55 ? '#111' : '#fff'} /> : null}
            </Tap>
          );
        })}
      </View>
      <Field label="Nome da cor" value={draft.colorName} onChangeText={(t) => patch({ colorName: t })}
        placeholder="Ex.: Azul-petróleo" maxLength={40} error={errors?.colorName} />

      <SectionTitle>Peso e preço</SectionTitle>
      <Field label="Peso da bobine" suffix="g" numeric="decimal" value={draft.weightG}
        onChangeText={(t) => patch({ weightG: t })} error={errors?.weightG} />
      <View style={styles.wrap}>
        {QUICK_WEIGHTS.map((w) => (
          <Chip key={w} label={`${w} g`} selected={weight === w} onPress={() => patch({ weightG: String(w) })} />
        ))}
      </View>
      <Field label="Quanto pagaste" suffix="€" numeric="decimal" placeholder="0,00" value={draft.pricePaid}
        onChangeText={(t) => patch({ pricePaid: t })} error={errors?.pricePaid} />

      {perKg !== null ? (
        <Card style={styles.preview}>
          <View style={{ flex: 1 }}>
            <Text style={[typo.bodyStrong, typo.number]}>{formatMoney(perKg)}</Text>
            <Text style={typo.caption}>por kg</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typo.bodyStrong, typo.number]}>{formatMoney(perKg / 1000, 3)}</Text>
            <Text style={typo.caption}>por grama</Text>
          </View>
        </Card>
      ) : null}
    </PageShell>
  );
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  swatch: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)',
  },
  swatchOn: { borderColor: colors.accent },
  preview: { flexDirection: 'row', borderRadius: radius.lg, backgroundColor: colors.surfaceHi },
});
