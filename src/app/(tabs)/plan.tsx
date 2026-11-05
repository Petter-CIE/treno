import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, DiscIcon, Icon, Row, Screen, Section, T } from '@/components/ui';
import { DISCIPLINES } from '@/data/exercises';
import { PROGRAMS, PROGRAM_BY_ID, WORKOUTS, WORKOUT_BY_ID } from '@/data/programs';
import { addDays, fmtDate, isoWeek, parseYmd, startOfWeek, today, ymd } from '@/lib/dates';
import { LANG_TAG, pick } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';
import type { Discipline, Program } from '@/lib/types';

export default function PlanScreen() {
  const { t, lang, plan, log, program, settings, removePlan, addPlan, stopProgram } = useStore();
  const [offset, setOffset] = useState(0);
  const [pickFor, setPickFor] = useState<string | null>(null);
  const monday = addDays(startOfWeek(new Date()), offset * 7);
  const td = today();

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = ymd(addDays(monday, i));
    return { i, date, entries: plan.filter((p) => p.date === date && WORKOUT_BY_ID[p.workout]), logs: log.filter((l) => l.date === date) };
  });

  const active = program ? PROGRAM_BY_ID[program.id] : null;
  const activeWeek = program ? Math.floor((parseYmd(td).getTime() - parseYmd(program.start).getTime()) / (7 * 86400000)) + 1 : 0;

  const mine = (p: Program) => !settings.disciplines.length || settings.disciplines.includes(p.discipline);
  const recommended = PROGRAMS.filter(mine);
  const others = PROGRAMS.filter((p) => !mine(p));

  return (
    <Screen title={t('tab.plan')}>
      <Card style={{ gap: 4, paddingHorizontal: 8 }}>
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 6 }}>
          <Pressable onPress={() => setOffset(offset - 1)} hitSlop={12} accessibilityLabel="previous week">
            <Icon name="chevron-left" size={26} />
          </Pressable>
          <Pressable onPress={() => setOffset(0)}>
            <T variant="h3" style={{ textAlign: 'center' }}>
              {t('plan.week', { n: isoWeek(monday) })}
            </T>
            <T variant="small" style={{ textAlign: 'center' }}>
              {fmtDate(ymd(monday), LANG_TAG[lang], { day: 'numeric', month: 'short' })} – {fmtDate(ymd(addDays(monday, 6)), LANG_TAG[lang], { day: 'numeric', month: 'short' })}
            </T>
          </Pressable>
          <Pressable onPress={() => setOffset(offset + 1)} hitSlop={12} accessibilityLabel="next week">
            <Icon name="chevron-right" size={26} />
          </Pressable>
        </Row>
        {days.map((d) => {
          const isToday = d.date === td;
          return (
            <View key={d.date} style={[st.day, isToday && { backgroundColor: C.surface2 }]}>
              <View style={{ width: 46 }}>
                <T style={{ fontWeight: '800', color: isToday ? C.accent : C.text }}>{t(`wd.${d.i}` as 'wd.0')}</T>
                <T variant="small">{parseYmd(d.date).getDate()}.</T>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                {d.entries.map((e) => {
                  const w = WORKOUT_BY_ID[e.workout];
                  const done = d.logs.some((l) => l.workout === e.workout);
                  return (
                    <Pressable
                      key={e.id}
                      style={st.entry}
                      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: w.id } })}
                      onLongPress={() =>
                        Alert.alert(pick(w.name, lang), undefined, [
                          { text: t('common.cancel'), style: 'cancel' },
                          { text: t('plan.remove'), style: 'destructive', onPress: () => removePlan(e.id) },
                        ])
                      }
                    >
                      <DiscIcon d={w.discipline} size={26} />
                      <T numberOfLines={1} style={{ flex: 1, fontWeight: '600' }}>
                        {pick(w.name, lang)}
                      </T>
                      {done ? <Icon name="check" color={C.good} /> : null}
                    </Pressable>
                  );
                })}
                {d.logs
                  .filter((l) => !d.entries.some((e) => e.workout === l.workout))
                  .map((l) => (
                    <View key={l.id} style={st.entry}>
                      <Icon name="check" color={C.good} />
                      <T numberOfLines={1} style={{ flex: 1, color: C.muted }}>
                        {l.title}
                      </T>
                    </View>
                  ))}
                {!d.entries.length && !d.logs.length ? <T variant="small">{t('plan.rest')}</T> : null}
              </View>
              {d.date >= td ? (
                <Pressable onPress={() => setPickFor(d.date)} hitSlop={10} style={st.add} accessibilityLabel={t('plan.add')}>
                  <Icon name="plus" size={18} color={C.muted} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </Card>

      {active && program ? (
        <Card style={{ borderColor: C.accent }}>
          <T variant="label">{t('plan.active')}</T>
          <T variant="h3">{pick(active.name, lang)}</T>
          <T variant="muted">{t('plan.progress', { week: Math.min(Math.max(activeWeek, 1), active.weeks), weeks: active.weeks })}</T>
          <View style={st.bar}>
            <View style={[st.barFill, { width: `${Math.min(100, (Math.max(activeWeek - 1, 0) / active.weeks) * 100)}%` }]} />
          </View>
          <Button
            label={t('plan.stop')}
            variant="danger"
            style={{ alignSelf: 'flex-start' }}
            onPress={() =>
              Alert.alert(t('plan.stop'), t('plan.stopConfirm'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('plan.stop'), style: 'destructive', onPress: stopProgram },
              ])
            }
          />
        </Card>
      ) : null}

      <Section title={settings.disciplines.length ? t('plan.recommended') : t('plan.programs')}>
        {recommended.map((p) => (
          <ProgramRow key={p.id} p={p} />
        ))}
      </Section>
      {others.length ? (
        <Section title={t('plan.other')}>
          {others.map((p) => (
            <ProgramRow key={p.id} p={p} />
          ))}
        </Section>
      ) : null}

      <WorkoutPicker date={pickFor} onClose={() => setPickFor(null)} onPick={(id) => pickFor && addPlan(pickFor, id)} />
    </Screen>
  );
}

function ProgramRow({ p }: { p: Program }) {
  const { t, lang } = useStore();
  return (
    <Card onPress={() => router.push({ pathname: '/program/[id]', params: { id: p.id } })}>
      <Row gap={12}>
        <DiscIcon d={p.discipline} />
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="h3">{pick(p.name, lang)}</T>
          <T variant="muted">
            {t('plan.meta', { weeks: p.weeks, perWeek: p.perWeek })} · {t(`level.${p.level}` as 'level.1')}
          </T>
        </View>
        <Icon name="chevron-right" color={C.faint} />
      </Row>
    </Card>
  );
}

function WorkoutPicker({ date, onClose, onPick }: { date: string | null; onClose: () => void; onPick: (id: string) => void }) {
  const { t, lang } = useStore();
  const insets = useSafeAreaInsets();
  const [disc, setDisc] = useState<Discipline | null>(null);
  const list = WORKOUTS.filter((w) => !disc || w.discipline === disc);
  return (
    <Modal visible={!!date} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} />
      <View style={[st.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <T variant="h2">{t('plan.choose')}</T>
            {date ? <T variant="muted">{fmtDate(date, LANG_TAG[lang], { weekday: 'long', day: 'numeric', month: 'long' })}</T> : null}
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Icon name="close" size={26} />
          </Pressable>
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0, flexShrink: 0 }}>
          <Chip label={t('all')} active={!disc} onPress={() => setDisc(null)} />
          {DISCIPLINES.map((d) => (
            <Chip key={d} label={t(`disc.${d}` as 'disc.gym')} active={disc === d} onPress={() => setDisc(d)} />
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={{ gap: 8 }}>
          {list.map((w) => (
            <Pressable
              key={w.id}
              style={st.pickRow}
              onPress={() => {
                onPick(w.id);
                onClose();
              }}
            >
              <DiscIcon d={w.discipline} size={34} />
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '700' }}>{pick(w.name, lang)}</T>
                <T variant="small">
                  {pick(w.focus, lang)} · {w.minutes} {t('common.min')}
                </T>
              </View>
              <Icon name="plus" color={C.accent} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  day: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  add: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 6, borderRadius: 3, backgroundColor: C.surface2, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: C.accent },
  backdrop: { flex: 1, backgroundColor: '#0008' },
  sheet: { maxHeight: '80%', backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 14 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: C.surface2 },
});
