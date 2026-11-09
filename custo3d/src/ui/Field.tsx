import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { sanitizeDecimal } from '../lib/format';
import { colors, radius, space, typo } from '../theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  numeric?: 'decimal' | 'int';
  suffix?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  maxLength?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Field({
  label, value, onChangeText, numeric, suffix, placeholder, error, hint, multiline, maxLength, containerStyle,
}: Props) {
  const [focused, setFocused] = useState(false);
  const handle = (t: string) =>
    onChangeText(numeric === 'decimal' ? sanitizeDecimal(t) : numeric === 'int' ? t.replace(/\D/g, '') : t);
  return (
    <View style={containerStyle}>
      <Text style={[typo.label, styles.label]}>{label}</Text>
      <View style={[styles.box, multiline && styles.boxMulti, focused && styles.boxFocus, !!error && styles.boxError]}>
        <TextInput
          value={value}
          onChangeText={handle}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          selectionColor={colors.accent}
          keyboardAppearance="dark"
          keyboardType={numeric === 'decimal' ? 'decimal-pad' : numeric === 'int' ? 'number-pad' : 'default'}
          multiline={multiline}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          style={[typo.body, styles.input, multiline && styles.inputMulti]}
        />
        {suffix ? <Text style={[typo.caption, styles.suffix]}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={[typo.caption, styles.hint]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: space.xs + 2 },
  box: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
  },
  boxMulti: { alignItems: 'flex-start', paddingVertical: space.sm },
  boxFocus: { borderColor: colors.accent },
  boxError: { borderColor: colors.danger },
  input: { flex: 1, paddingVertical: 0, minHeight: 48 },
  inputMulti: { minHeight: 84, textAlignVertical: 'top', paddingTop: space.sm },
  suffix: { marginLeft: space.sm, fontSize: 14 },
  error: { color: colors.danger, fontSize: 13, marginTop: space.xs + 2 },
  hint: { marginTop: space.xs + 2 },
});
