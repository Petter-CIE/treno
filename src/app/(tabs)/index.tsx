import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { WorkoutCard } from '@/components/WorkoutCard';
import { Button, Card, Icon, Row, Screen, Section, T, type IconName } from '@/components/ui';
import { PROGRAM_BY_ID, WORKOUT_BY_ID } from '@/data/programs';
import { addDays, fmtDate, fmtDuration, startOfWeek, today, ymd } from '@/lib/dates';
import { LANG_TAG, pick } from '@/lib/i18n';
import { useStore, weeklyStreak, workoutsThisWeek } from '@/lib/store';
import { C, DISC_COLOR } from '@/lib/theme';
import { workoutsFor } from '@/lib/workout';

export default function TodayScreen() {
  const { t, lang, settings, plan, log, program } = useStore();
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 10 ? t('today.morning') : h < 18 ? t('today.afternoon') : t('today.evening');
  const td = today();

  const doneToday = log.filter((l) => l.date === td);
  const plannedToday = plan.filter((p) => p.date === td && WORKOUT_BY_ID[p.workout]);
  const doneCount = workoutsThisWeek(log);
  const streak = weeklyStreak(log, settings.weeklyGoal);

  const monday = startOfWeek(now);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = ymd(addDays(monday, i));
    return {
      i,
      date,
      done: log.some((l) => l.date === date),
      planned: plan.some((p) => p.date === date),
      isToday: date === td,
    };
  });

  const suggestions = useMemo(() => {
    // one workout per discipline first, so the row shows variety
    const list = workoutsFor(settings).filter((w) => !w.id.startsWith('run5k_w'));
    const seen = new Set<string>();
    const firsts = list.filter((w) => (seen.has(w.discipline) ? false : (seen.add(w.discipline), true)));
    return [...firsts, ...list.filter((w) => !firsts.includes(w))].slice(0, 8);
  }, [settings]);
  const last = log[0];

  const quick: { key: string; label: string; icon: IconName; mode: string }[] = [
    { key: 'tabata', label: t('quick.tabata'), icon: 'fire', mode: 'interval' },
    { key: 'emom', label: t('quick.emom'), icon: 'timer-outline', mode: 'emom' },
    { key: 'amrap', label: t('quick.amrap'), icon: 'repeat', mode: 'amrap' },
    { key: 'custom', label: t('quick.custom'), icon: 'tune-variant', mode: 'steady' },
  ];

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <T variant="muted">{fmtDate(td, LANG_TAG[lang], { weekday: 'long', day: 'numeric', month: 'long' })}</T>
        <T variant="h1">{greeting}</T>
      </View>

      {!settings.onboarded ? (
        <Card style={{ backgroundColor: C.accentDim, borderColor: C.accent }}>
          <T variant="h3">{t('today.welcome')}</T>
          <T variant="muted">{t('today.welcomeText')}</T>
          <Button label={t('today.setup')} icon="chevron-right" onPress={() => router.push('/onboarding')} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
        </Card>
      ) : null}

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="h3">{t('today.week', { done: doneCount, goal: settings.weeklyGoal })}</T>
          <Row gap={4}>
            <Icon name="fire" color={streak ? C.accent : C.faint} size={20} />
            <T style={{ fontWeight: '800', color: streak ? C.accent : C.faint }}>{streak}</T>
          </Row>
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
          {week.map((d) => (
            <View key={d.date} style={{ alignItems: 'center', gap: 6 }}>
              <T variant="small" style={d.isToday ? { color: C.text, fontWeight: '800' } : undefined}>
                {t(`wd.${d.i}` as 'wd.0')}
              </T>
              <View style={[st.dot, d.done ? st.dotDone : d.planned ? st.dotPlanned : null, d.isToday && !d.done ? { borderColor: C.text } : null]}>
                {d.done ? <Icon name="check" size={16} color="#0D1F14" /> : null}
              </View>
            </View>
          ))}
        </Row>
        <T variant="small">{streak ? t('today.streak', { n: streak }) : t('today.streakZero')}</T>
      </Card>

      <Section title={t('today.planned')}>
        {plannedToday.length ? (
          plannedToday.map((p) => <WorkoutCard key={p.id} w={WORKOUT_BY_ID[p.workout]} done={doneToday.some((l) => l.workout === p.workout)} />)
        ) : doneToday.length ? (
          <Card style={{ borderColor: C.good }}>
            <Row>
              <Icon name="check" color={C.good} />
              <T variant="h3">{t('today.done')}</T>
            </Row>
            <T variant="muted">{doneToday.map((l) => l.title).join(', ')}</T>
          </Card>
        ) : (
          <Card>
            <T variant="h3">{t('today.nothing')}</T>
            <T variant="muted">{t('today.nothingHint')}</T>
            {!program ? <Button label={t('today.programs')} variant="secondary" icon="calendar-month" onPress={() => router.push('/plan')} style={{ alignSelf: 'flex-start', marginTop: 4 }} /> : null}
          </Card>
        )}
        {program && PROGRAM_BY_ID[program.id] ? (
          <T variant="small">
            {t('plan.active')}: {pick(PROGRAM_BY_ID[program.id].name, lang)}
          </T>
        ) : null}
      </Section>

      <Section title={t('today.quick')}>
        <Row gap={10}>
          {quick.map((q) => (
            <Pressable key={q.key} style={st.quick} onPress={() => router.push({ pathname: '/custom', params: { mode: q.mode, preset: q.key } })}>
              <Icon name={q.icon} color={C.accent} size={26} />
              <T style={{ fontWeight: '700', fontSize: 13 }}>{q.label}</T>
            </Pressable>
          ))}
        </Row>
      </Section>

      {suggestions.length ? (
        <Section title={t('plan.workouts')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} style={{ marginHorizontal: -16 }}>
            <View style={{ width: 6 }} />
            {suggestions.map((w) => (
              <Pressable key={w.id} style={[st.sugg, { borderTopColor: DISC_COLOR[w.discipline] }]} onPress={() => router.push({ pathname: '/workout/[id]', params: { id: w.id } })}>
                <T variant="small" style={{ color: DISC_COLOR[w.discipline], fontWeight: '700' }}>
                  {t(`disc.${w.discipline}` as 'disc.gym')}
                </T>
                <T variant="h3" numberOfLines={2}>
                  {pick(w.name, lang)}
                </T>
                <T variant="small">
                  {w.minutes} {t('common.min')}
                </T>
              </Pressable>
            ))}
            <View style={{ width: 6 }} />
          </ScrollView>
        </Section>
      ) : null}

      {last ? (
        <Section title={t('today.last')}>
          <Card onPress={() => router.push('/log')}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="h3" numberOfLines={1} style={{ flex: 1 }}>
                {last.title}
              </T>
              <T variant="muted">{fmtDate(last.date, LANG_TAG[lang])}</T>
            </Row>
            <T variant="muted">
              {fmtDuration(last.durationSec)}
              {last.rpe ? ` · RPE ${last.rpe}` : ''}
            </T>
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: C.good, borderColor: C.good },
  dotPlanned: { borderColor: C.accent },
  quick: { flex: 1, backgroundColor: C.surface, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  sugg: { width: 160, backgroundColor: C.surface, borderRadius: 16, padding: 14, gap: 6, borderTopWidth: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
});
