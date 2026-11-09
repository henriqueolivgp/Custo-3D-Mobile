import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text } from 'react-native';
import { parseDecimal, toInputText } from '../lib/format';
import { store, useStore } from '../store/appStore';
import { colors, space, typo } from '../theme';
import { Field } from '../ui/Field';
import { ScreenHeader } from '../ui/Page';
import { Card, SectionTitle } from '../ui/primitives';

function NumberSetting({ label, hint, suffix, value, onCommit }: {
  label: string; hint: string; suffix: string; value: number; onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(() => toInputText(value));
  return (
    <Field
      label={label}
      hint={hint}
      suffix={suffix}
      numeric="decimal"
      value={text}
      onChangeText={(t) => {
        setText(t);
        const n = t.trim() === '' ? 0 : parseDecimal(t);
        if (n !== null) onCommit(n);
      }}
    />
  );
}

export function SettingsScreen() {
  const s = useStore((st) => st.settings);
  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <ScreenHeader title="Definições" subtitle="Aplicam-se a todos os produtos" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SectionTitle>Custos de produção</SectionTitle>
        <NumberSetting label="Preço da eletricidade" suffix="€/kWh" value={s.energyPricePerKwh}
          hint="O preço por kWh da tua fatura." onCommit={(n) => store.updateSettings({ energyPricePerKwh: n })} />
        <NumberSetting label="Consumo da impressora" suffix="W" value={s.printerWatts}
          hint="Consumo médio durante a impressão." onCommit={(n) => store.updateSettings({ printerWatts: n })} />
        <NumberSetting label="Desgaste da máquina" suffix="€/h" value={s.machineCostPerHour}
          hint="Amortização e manutenção por hora de impressão: bicos, correias, peças." onCommit={(n) => store.updateSettings({ machineCostPerHour: n })} />
        <NumberSetting label="Margem para falhas" suffix="%" value={s.failureRatePct}
          hint="Extra para cobrir impressões que correm mal." onCommit={(n) => store.updateSettings({ failureRatePct: n })} />
        <NumberSetting label="Embalagem e extras por peça" suffix="€" value={s.packagingCost}
          hint="Caixa, etiqueta, argola, ímanes…" onCommit={(n) => store.updateSettings({ packagingCost: n })} />

        <SectionTitle>Venda</SectionTitle>
        <NumberSetting label="Margem de lucro" suffix="%" value={s.marginPct}
          hint="Somada ao custo total para obter o preço de venda." onCommit={(n) => store.updateSettings({ marginPct: n })} />

        <Card style={{ marginTop: space.xl }}>
          <Text style={[typo.caption, { fontSize: 14, lineHeight: 20 }]}>
            Os dados ficam guardados só neste telemóvel. Mudar uma definição atualiza o preço de todos os produtos.
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: space.xl, paddingBottom: space.xxl * 2, gap: space.md },
});
