import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { calcBreakdown, costPerGram } from '../lib/calc';
import { formatMoney } from '../lib/format';
import { newId } from '../lib/ids';
import {
  draftMinutes, emptyProductDraft, productToDraft, resolveDraftLines, validateProduct,
} from '../lib/validation';
import type { LineDraft, ProductDraft } from '../lib/validation';
import { store, useStore } from '../store/appStore';
import { colors, radius, space, typo } from '../theme';
import { BreakdownCard } from '../ui/BreakdownCard';
import { Field } from '../ui/Field';
import { PageShell } from '../ui/Page';
import { Button, Card, IconButton, SectionTitle, Tap } from '../ui/primitives';
import { SpoolDisc } from '../ui/SpoolDisc';
import { SpoolPicker } from '../ui/SpoolPicker';

export function ProductFormPage({ productId, onClose }: { productId?: string; onClose: () => void }) {
  const spools = useStore((s) => s.spools);
  const products = useStore((s) => s.products);
  const settings = useStore((s) => s.settings);
  const existing = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  const [draft, setDraft] = useState<ProductDraft>(() => (existing ? productToDraft(existing) : emptyProductDraft()));
  const [submitted, setSubmitted] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const spoolMap = useMemo(() => new Map(spools.map((s) => [s.id, s])), [spools]);
  const result = useMemo(() => validateProduct(draft, spools), [draft, spools]);
  const errors = submitted && !result.ok ? result.errors : undefined;

  const lineCalc = useMemo(() => resolveDraftLines(draft.lines, spoolMap), [draft.lines, spoolMap]);
  const minutes = draftMinutes(draft);
  const breakdown = useMemo(() => {
    const valid = lineCalc.flatMap((l) =>
      l.grams !== null && l.costPerGram !== null ? [{ grams: l.grams, costPerGram: l.costPerGram }] : [],
    );
    return valid.length > 0 ? calcBreakdown(valid, minutes, settings) : null;
  }, [lineCalc, minutes, settings]);

  const patch = (p: Partial<ProductDraft>) => setDraft((d) => ({ ...d, ...p }));
  const patchLine = (key: string, p: Partial<LineDraft>) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...p } : l)) }));
  const addLine = () =>
    setDraft((d) => ({ ...d, lines: [...d.lines, { key: newId(), spoolId: null, grams: '' }] }));
  const removeLine = (key: string) => setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== key) }));

  const save = () => {
    if (!result.ok) {
      setSubmitted(true);
      return;
    }
    store.saveProduct(result.value, existing?.id);
    onClose();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert('Apagar produto?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          store.removeProduct(existing.id);
          onClose();
        },
      },
    ]);
  };

  const pickingLine = pickerFor ? draft.lines.find((l) => l.key === pickerFor) : undefined;

  return (
    <>
      <PageShell
        title={existing ? 'Editar produto' : 'Novo produto'}
        onBack={onClose}
        right={existing ? <IconButton icon="trash-outline" label="Apagar produto" color={colors.danger} onPress={remove} /> : undefined}
        footer={
          <>
            {errors ? <Text style={styles.error}>Corrige os campos assinalados.</Text> : null}
            <View style={styles.footerRow}>
              <View style={{ flex: 1 }}>
                <Text style={typo.caption}>Preço de venda</Text>
                <Text style={[typo.heading, typo.number, { color: colors.price, fontSize: 26 }]}>
                  {breakdown ? formatMoney(breakdown.price) : '—'}
                </Text>
              </View>
              <Button label={existing ? 'Guardar alterações' : 'Guardar produto'} onPress={save} />
            </View>
          </>
        }
      >
        <Field label="Nome" value={draft.name} onChangeText={(t) => patch({ name: t })}
          placeholder="Ex.: Suporte para auscultadores" maxLength={80} error={errors?.name} />
        <Field label="Descrição (opcional)" value={draft.description} onChangeText={(t) => patch({ description: t })}
          placeholder="Notas, medidas, acabamento…" multiline maxLength={500} />

        <SectionTitle>Materiais usados</SectionTitle>
        {draft.lines.map((line) => {
          const i = draft.lines.indexOf(line);
          const spool = line.spoolId ? spoolMap.get(line.spoolId) : undefined;
          const missing = !!line.spoolId && !spool;
          const calc = lineCalc[i]!;
          const lineErr = errors?.lines[line.key];
          const lineCost = calc.grams !== null && calc.costPerGram !== null ? calc.grams * calc.costPerGram : null;
          return (
            <Card key={line.key} style={{ gap: space.md }}>
              <View style={styles.lineTop}>
                <Tap
                  onPress={() => setPickerFor(line.key)}
                  accessibilityLabel="Escolher bobine"
                  containerStyle={{ flex: 1 }}
                  style={[styles.picker, !!lineErr?.spool && { borderColor: colors.danger }]}
                >
                  {spool ? (
                    <SpoolDisc color={spool.colorHex} size={36} />
                  ) : (
                    <View style={styles.pickerEmpty}><Ionicons name="add" size={20} color={colors.muted} /></View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={typo.bodyStrong} numberOfLines={1}>
                      {spool ? spool.colorName : missing ? 'Bobine removida' : 'Escolher bobine'}
                    </Text>
                    {spool ? (
                      <Text style={typo.caption}>{spool.type}, {formatMoney(costPerGram(spool) * 1000)} por kg</Text>
                    ) : missing ? (
                      <Text style={typo.caption}>A usar o último custo guardado</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.muted} />
                </Tap>
                {draft.lines.length > 1 ? (
                  <IconButton icon="trash-outline" label="Remover material" color={colors.muted} onPress={() => removeLine(line.key)} />
                ) : null}
              </View>
              {lineErr?.spool ? <Text style={styles.error}>{lineErr.spool}</Text> : null}
              <Field
                label="Gramas gastas"
                suffix="g"
                numeric="decimal"
                placeholder="0"
                value={line.grams}
                onChangeText={(t) => patchLine(line.key, { grams: t })}
                error={lineErr?.grams}
                hint={lineCost !== null ? `Custo deste material: ${formatMoney(lineCost)}` : undefined}
              />
            </Card>
          );
        })}
        <Button label="Adicionar material" icon="add" variant="soft" onPress={addLine} />

        <SectionTitle>Tempo de impressão</SectionTitle>
        <View style={styles.timeRow}>
          <Field label="Horas" suffix="h" numeric="int" placeholder="0" value={draft.hours}
            onChangeText={(t) => patch({ hours: t })} containerStyle={{ flex: 1 }} />
          <Field label="Minutos" suffix="min" numeric="int" placeholder="0" value={draft.minutes}
            onChangeText={(t) => patch({ minutes: t })} containerStyle={{ flex: 1 }} />
        </View>
        {errors?.time ? <Text style={styles.error}>{errors.time}</Text> : null}

        <SectionTitle>Cálculo</SectionTitle>
        {breakdown ? (
          <BreakdownCard breakdown={breakdown} marginPct={settings.marginPct} />
        ) : (
          <Card>
            <Text style={[typo.caption, { fontSize: 15, lineHeight: 21 }]}>
              Escolhe a bobine e indica as gramas gastas para ver o custo e o preço de venda. Os valores de eletricidade, desgaste e margem estão nas Definições.
            </Text>
          </Card>
        )}
      </PageShell>

      <SpoolPicker
        visible={pickerFor !== null}
        spools={spools}
        selectedId={pickingLine?.spoolId ?? null}
        onClose={() => setPickerFor(null)}
        onSelect={(id) => {
          if (pickerFor) patchLine(pickerFor, { spoolId: id, snapshot: undefined });
          setPickerFor(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  lineTop: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHi,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pickerEmpty: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: colors.muted, alignItems: 'center', justifyContent: 'center',
  },
  timeRow: { flexDirection: 'row', gap: space.md },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  error: { color: colors.danger, fontSize: 13 },
});
