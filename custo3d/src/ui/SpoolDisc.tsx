import { memo } from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

/** Bobine desenhada com Views: disco de fio na cor real, anel de enrolamento e furo central. */
export const SpoolDisc = memo(function SpoolDisc({ color, size = 48 }: { color: string; size?: number }) {
  const ring = size * 0.62;
  const hub = size * 0.3;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: ring, height: ring, borderRadius: ring / 2, borderWidth: Math.max(1, size * 0.045), borderColor: 'rgba(0,0,0,0.22)' }} />
      <View style={{ position: 'absolute', width: hub, height: hub, borderRadius: hub / 2, backgroundColor: colors.bg }} />
    </View>
  );
});
