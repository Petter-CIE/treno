import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, DISC_COLOR, DISC_ICON, R } from '@/lib/theme';
import type { Discipline } from '@/lib/types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 20, color = C.text }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export function Screen({ children, title, right, scroll = true }: { children?: ReactNode; title?: string; right?: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const header = title ? (
    <View style={s.header}>
      <Text style={s.h1}>{title}</Text>
      {right}
    </View>
  ) : null;
  if (!scroll)
    return (
      <View style={[s.screen, { paddingTop: insets.top + 8 }]}>
        {header}
        {children}
      </View>
    );
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40, paddingHorizontal: 16, gap: 14 }}>
      {header}
      {children}
    </ScrollView>
  );
}

export function T({ children, style, variant = 'body', numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; variant?: 'h1' | 'h2' | 'h3' | 'body' | 'muted' | 'small' | 'label'; numberOfLines?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[s[variant], style]}>
      {children}
    </Text>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }, style]}>
        {children}
      </Pressable>
    );
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  style,
  disabled,
  big,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  big?: boolean;
}) {
  const bg = { primary: C.accent, secondary: C.surface2, ghost: 'transparent', danger: C.surface2 }[variant];
  const fg = { primary: '#1A0E07', secondary: C.text, ghost: C.muted, danger: C.danger }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, big && s.btnBig, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, style]}
    >
      {icon ? <Icon name={icon} size={big ? 24 : 18} color={fg} /> : null}
      <Text style={[s.btnText, big && { fontSize: 18 }, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color = C.accent, icon }: { label: string; active?: boolean; onPress?: () => void; color?: string; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, active ? { backgroundColor: color, borderColor: color } : null]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      {icon ? <Icon name={icon} size={16} color={active ? '#111' : C.muted} /> : null}
      <Text style={[s.chipText, active ? { color: '#111' } : null]}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Wrap({ children, gap = 8 }: { children: ReactNode; gap?: number }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{children}</View>;
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="label">{title}</T>
        {right}
      </Row>
      {children}
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      {label ? <T>{label}</T> : null}
      <Row gap={12}>
        <Pressable style={s.stepBtn} onPress={() => onChange(Math.max(min, +(value - step).toFixed(2)))} accessibilityLabel="-">
          <Icon name="minus" />
        </Pressable>
        <Text style={s.stepValue}>{value}</Text>
        <Pressable style={s.stepBtn} onPress={() => onChange(Math.min(max, +(value + step).toFixed(2)))} accessibilityLabel="+">
          <Icon name="plus" />
        </Pressable>
      </Row>
    </Row>
  );
}

export function DiscBadge({ d, label }: { d: Discipline; label: string }) {
  const color = DISC_COLOR[d];
  return (
    <View style={[s.badge, { backgroundColor: `${color}22` }]}>
      <Icon name={DISC_ICON[d] as IconName} size={14} color={color} />
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function DiscIcon({ d, size = 40 }: { d: Discipline; size?: number }) {
  const color = DISC_COLOR[d];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 3, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={DISC_ICON[d] as IconName} size={size * 0.55} color={color} />
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.border }} />;
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  h1: { color: C.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  h2: { color: C.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { color: C.text, fontSize: 17, fontWeight: '700' },
  body: { color: C.text, fontSize: 15, lineHeight: 21 },
  muted: { color: C.muted, fontSize: 14, lineHeight: 20 },
  small: { color: C.muted, fontSize: 12 },
  label: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: 16, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 18, borderRadius: R.pill },
  btnBig: { paddingVertical: 18 },
  btnText: { fontSize: 15, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  chipText: { color: C.text, fontSize: 14, fontWeight: '600' },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  stepValue: { color: C.text, fontSize: 18, fontWeight: '700', minWidth: 44, textAlign: 'center', fontVariant: ['tabular-nums'] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: R.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
