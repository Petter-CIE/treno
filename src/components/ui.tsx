import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, DISC_COLOR, DISC_ICON, FONT, R, TAB_SPACE } from '@/lib/theme';
import type { Discipline } from '@/lib/types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Maps fontWeight to the matching Plus Jakarta Sans file (custom fonts ignore fontWeight on Android). */
export function fontStyle(style: StyleProp<TextStyle>): TextStyle {
  const f = StyleSheet.flatten(style) ?? {};
  if (f.fontFamily) return f;
  const w = String(f.fontWeight ?? '400');
  const key = (w === 'bold' ? 700 : w === 'normal' ? 400 : Math.min(800, Math.max(400, Math.round(Number(w) / 100) * 100))) as keyof typeof FONT;
  const { fontWeight: _drop, ...rest } = f;
  return { ...rest, fontFamily: FONT[key] ?? FONT[400] };
}

/** Text in the app font. Use instead of react-native's Text. */
export function Txt({ style, ...p }: TextProps) {
  return <Text {...p} style={fontStyle(style)} />;
}

export function Icon({ name, size = 20, color = C.text }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export function Screen({ children, title, right, scroll = true }: { children?: ReactNode; title?: string; right?: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const header = title ? (
    <View style={s.header}>
      <Txt style={[s.h1, { flex: 1 }]} numberOfLines={2}>
        {title}
      </Txt>
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
    <ScrollView style={s.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: TAB_SPACE + insets.bottom, paddingHorizontal: 18, gap: 18 }}>
      {header}
      {children}
    </ScrollView>
  );
}

/** Round close button for modal screens. */
export function CloseButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel={label} style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.7 }]}>
      <Icon name="close" size={22} />
    </Pressable>
  );
}

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'muted' | 'small' | 'label';
export function T({ children, style, variant = 'body', numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; variant?: Variant; numberOfLines?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={fontStyle([s[variant], style])}>
      {children}
    </Text>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }, style]}>
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
  const bg = { primary: 'transparent', secondary: C.surface2, ghost: 'transparent', danger: C.dangerDim }[variant];
  const fg = { primary: C.onAccent, secondary: C.text, ghost: C.muted, danger: C.danger }[variant];
  const inner = (
    <>
      {icon ? <Icon name={icon} size={big ? 22 : 18} color={fg} /> : null}
      <Txt style={[s.btnText, big && { fontSize: 17 }, { color: fg }]}>{label}</Txt>
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btnWrap, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, style]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={[C.accent, C.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.btn, big && s.btnBig]}>
          {inner}
        </LinearGradient>
      ) : (
        <View style={[s.btn, big && s.btnBig]}>{inner}</View>
      )}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color = C.accent, icon }: { label: string; active?: boolean; onPress?: () => void; color?: string; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.chip, active ? { backgroundColor: color, borderColor: color } : null, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      {icon ? <Icon name={icon} size={16} color={active ? C.onAccent : C.muted} /> : null}
      <Txt style={[s.chipText, active ? { color: C.onAccent } : null]}>{label}</Txt>
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
    <View style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt style={s.section}>{title}</Txt>
        {right}
      </Row>
      {children}
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      {label ? <T style={{ flex: 1 }}>{label}</T> : null}
      <Row gap={6} style={s.stepper}>
        <Pressable style={s.stepBtn} onPress={() => onChange(Math.max(min, +(value - step).toFixed(2)))} accessibilityLabel="-" disabled={value <= min}>
          <Icon name="minus" color={value <= min ? C.faint : C.text} />
        </Pressable>
        <Txt style={s.stepValue}>{value}</Txt>
        <Pressable style={s.stepBtn} onPress={() => onChange(Math.min(max, +(value + step).toFixed(2)))} accessibilityLabel="+" disabled={value >= max}>
          <Icon name="plus" color={value >= max ? C.faint : C.text} />
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
      <Txt style={[s.badgeText, { color }]}>{label}</Txt>
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

/** Small neutral pill (duration, equipment, level …). */
export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'danger' }) {
  return (
    <View style={[s.pill, tone === 'danger' && { backgroundColor: C.dangerDim }]}>
      <Txt style={[s.pillText, tone === 'danger' && { color: C.danger }]}>{label}</Txt>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.border }} />;
}

// ── grouped settings list ──────────────────────────────────────────────

export function Group({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).flat().filter(Boolean);
  return (
    <View style={{ gap: 8 }}>
      {title ? <Txt style={s.groupTitle}>{title}</Txt> : null}
      <View style={s.group}>
        {items.map((c, i) => (
          <View key={i}>
            {i > 0 ? <View style={s.groupSep} /> : null}
            {c}
          </View>
        ))}
      </View>
      {footer ? <T variant="small" style={{ paddingHorizontal: 6, lineHeight: 17 }}>{footer}</T> : null}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor = C.accent,
  label,
  hint,
  value,
  onPress,
  right,
  danger,
  chevron = !!onPress,
}: {
  icon?: IconName;
  iconColor?: string;
  label: string;
  hint?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  chevron?: boolean;
}) {
  const body = (
    <>
      {icon ? (
        <View style={[s.rowIcon, { backgroundColor: `${danger ? C.danger : iconColor}1F` }]}>
          <Icon name={icon} size={18} color={danger ? C.danger : iconColor} />
        </View>
      ) : null}
      <View style={{ flexShrink: 0, maxWidth: value ? '62%' : undefined, flex: value ? undefined : 1, gap: 1 }}>
        <Txt style={[s.rowLabel, danger && { color: C.danger }]} numberOfLines={1}>
          {label}
        </Txt>
        {hint ? (
          <Txt style={s.rowHint} numberOfLines={2}>
            {hint}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt style={[s.rowValue, { flex: 1 }]} numberOfLines={1}>
          {value}
        </Txt>
      ) : null}
      {right}
      {chevron ? <Icon name="chevron-right" size={20} color={C.faint} /> : null}
    </>
  );
  if (!onPress) return <View style={s.row}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.row, pressed && { backgroundColor: C.surface2 }]}>
      {body}
    </Pressable>
  );
}

export function SwitchRow({ icon, iconColor, label, hint, value, onChange }: { icon?: IconName; iconColor?: string; label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <ListRow
      icon={icon}
      iconColor={iconColor}
      label={label}
      hint={hint}
      right={<Switch value={value} onValueChange={onChange} trackColor={{ true: C.accent, false: C.surface3 }} thumbColor="#fff" ios_backgroundColor={C.surface3} />}
    />
  );
}

// ── bottom sheet ───────────────────────────────────────────────────────

export function Sheet({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [y] = useState(() => new Animated.Value(400));
  useEffect(() => {
    if (visible) {
      y.setValue(400);
      Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }).start();
    }
  }, [visible, y]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="close" />
      <Animated.View style={[s.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: y }] }]}>
        <View style={s.handle} />
        {title ? <Txt style={s.sheetTitle}>{title}</Txt> : null}
        <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>{footer}</View> : null}
      </Animated.View>
    </Modal>
  );
}

export interface Option<V> {
  value: V;
  label: string;
  icon?: IconName;
  color?: string;
  hint?: string;
}

/** Drop-down style picker: tap a row, choose in a bottom sheet. Single or multiple choice. */
export function SelectSheet<V>({
  visible,
  onClose,
  title,
  options,
  selected,
  onChange,
  multi,
  doneLabel,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: Option<V>[];
  selected: V[];
  onChange: (next: V[]) => void;
  multi?: boolean;
  doneLabel: string;
}) {
  const pick = (v: V) => {
    if (!multi) {
      onChange([v]);
      onClose();
      return;
    }
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  return (
    <Sheet visible={visible} onClose={onClose} title={title} footer={multi ? <Button label={doneLabel} onPress={onClose} /> : undefined}>
      <View style={s.optList}>
        {options.map((o, i) => {
          const on = selected.includes(o.value);
          return (
            <Pressable key={String(o.value)} onPress={() => pick(o.value)} style={({ pressed }) => [s.opt, i > 0 && s.optSep, pressed && { backgroundColor: C.surface3 }]} accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={{ checked: on }}>
              {o.icon ? (
                <View style={[s.rowIcon, { backgroundColor: `${o.color ?? C.accent}1F` }]}>
                  <Icon name={o.icon} size={18} color={o.color ?? C.accent} />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Txt style={[s.rowLabel, on && { fontWeight: '700' }]}>{o.label}</Txt>
                {o.hint ? <Txt style={s.rowHint}>{o.hint}</Txt> : null}
              </View>
              {multi ? (
                <View style={[s.check, on && { backgroundColor: o.color ?? C.accent, borderColor: o.color ?? C.accent }]}>{on ? <Icon name="check" size={16} color={C.onAccent} /> : null}</View>
              ) : on ? (
                <Icon name="check" size={22} color={C.accent} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 2 },
  h1: { color: C.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  h2: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  h3: { color: C.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  body: { color: C.text, fontSize: 15, lineHeight: 22 },
  muted: { color: C.muted, fontSize: 14, lineHeight: 20 },
  small: { color: C.muted, fontSize: 12.5 },
  label: { color: C.muted, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  section: { color: C.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: 18, gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  btnWrap: { borderRadius: R.pill, overflow: 'hidden' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 20 },
  btnBig: { paddingVertical: 18 },
  btnText: { fontSize: 15, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 15, borderRadius: R.pill, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  chipText: { color: C.text, fontSize: 14, fontWeight: '600' },
  stepper: { backgroundColor: C.surface2, borderRadius: R.pill, padding: 4 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface3, alignItems: 'center', justifyContent: 'center' },
  stepValue: { color: C.text, fontSize: 17, fontWeight: '800', minWidth: 36, textAlign: 'center', fontVariant: ['tabular-nums'] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.pill, backgroundColor: C.surface2 },
  pillText: { color: C.muted, fontSize: 12, fontWeight: '600' },
  groupTitle: { color: C.muted, fontSize: 13, fontWeight: '700', paddingHorizontal: 6 },
  group: { backgroundColor: C.surface, borderRadius: R.lg, overflow: 'hidden' },
  groupSep: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 62 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, minHeight: 56 },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: C.text, fontSize: 15.5, fontWeight: '600' },
  rowHint: { color: C.muted, fontSize: 12.5 },
  rowValue: { color: C.muted, fontSize: 14.5, textAlign: 'right' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.backdrop },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: C.surface3, marginBottom: 12 },
  sheetTitle: { color: C.text, fontSize: 19, fontWeight: '800', paddingHorizontal: 20, marginBottom: 12 },
  optList: { backgroundColor: C.surface2, borderRadius: R.md, overflow: 'hidden' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14, minHeight: 54 },
  optSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: C.faint, alignItems: 'center', justifyContent: 'center' },
});
