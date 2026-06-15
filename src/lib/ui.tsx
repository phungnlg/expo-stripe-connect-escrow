import { Text, View, Pressable, ActivityIndicator } from 'react-native';
import { C, statusColor, statusLabel } from './theme';

export function Pill({ status }: { status: string }) {
  const color = statusColor(status);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: color }} />
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{statusLabel(status)}</Text>
    </View>
  );
}

export function Btn({ label, onPress, kind = 'primary', disabled }: { label: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean }) {
  const bg = kind === 'primary' ? C.accent : kind === 'danger' ? C.refunded : 'transparent';
  const border = kind === 'ghost' ? C.line : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ flex: 1, opacity: disabled ? 0.4 : 1, backgroundColor: bg, borderWidth: 1, borderColor: border, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
      <Text style={{ color: kind === 'ghost' ? C.text : '#fff', fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 16 }}>{children}</View>;
}

export function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: C.sub, fontSize: 14 }}>{k}</Text>
      <Text style={{ color: strong ? C.text : C.sub, fontSize: 14, fontWeight: strong ? '800' : '600' }}>{v}</Text>
    </View>
  );
}

export function Spinner() {
  return <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />;
}
