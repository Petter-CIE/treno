import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, Icon, Row, Section, Stepper, T, Wrap } from '@/components/ui';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { fmtDuration, today } from '@/lib/dates';
import { pick } from '@/lib/i18n';
import { session } from '@/lib/session';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';
import type { LoggedSet } from '@/lib/types';
import { distUnit, fmtPace, fmtWeight, fromKg, toKg, toKm, weightUnit } from '@/lib/units';
import { exName, loggableItems, workoutHasDistance } from '@/lib/workout';

export default function Summary() {
  const { t, lang, settings, log, addLog } = useStore();
  const insets = useSafeAreaInsets();
  const res = session.getResult();

  const items = useMemo(() => (res ? loggableItems(res.workout) : []), [res]);
  const lastWeight = (ex: string) => {
    for (const l of log) {
      const s = l.sets.find((x) => x.ex === ex && x.weightKg);
      if (s) return s.weightKg!;
    }
    const e = EXERCISE_BY_ID[ex];
    if (e?.equipment === 'kettlebell') return settings.bells[Math.floor(settings.bells.length / 2)] ?? 12;
    if (e?.equipment === 'barbell') return 20;
    return 10;
  };

  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.filter((i) => EXERCISE_BY_ID[i.ex]?.weighted).map((i) => [i.ex, lastWeight(i.ex)])),
  );
  const [rpe, setRpe] = useState<number | undefined>();
  const [note, setNote] = useState('');
  const [dist, setDist] = useState('');

  if (!res) return <Redirect href="/" />;
  const hasDistance = workoutHasDistance(res.workout);
  const distNum = parseFloat(dist.replace(',', '.'));
  const km = hasDistance && distNum > 0 ? toKm(distNum, settings.unit) : undefined;

  const save = () => {
    const sets: LoggedSet[] = items.map((i) => ({ ex: i.ex, reps: i.reps, sets: i.sets, seconds: i.seconds, weightKg: weights[i.ex] }));
    addLog({
      date: today(),
      finishedAt: new Date().toISOString(),
      workout: res.workout.id === 'custom' ? undefined : res.workout.id,
      discipline: res.workout.discipline,
      title: pick(res.workout.name, lang),
      durationSec: res.durationSec,
      rounds: res.rounds,
      distanceKm: km,
      sets,
      rpe,
      note: note.trim() || undefined,
    });
    session.clearResult();
    router.replace('/');
  };

  const discard = () => {
    session.clearResult();
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={st.badge}>
            <Icon name={res.completed ? 'trophy' : 'check'} size={40} color={C.accent} />
          </View>
          <T variant="h1">{t('sum.title')}</T>
          <T variant="muted">{pick(res.workout.name, lang)}</T>
        </View>

        <Row gap={10}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <T variant="h2">{fmtDuration(res.durationSec)}</T>
            <T variant="small">{t('sum.duration')}</T>
          </Card>
          {res.rounds ? (
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <T variant="h2">{res.rounds}</T>
              <T variant="small">{t('sum.rounds')}</T>
            </Card>
          ) : null}
          {km ? (
            <Card style={{ flex: 1, alignItems: 'center' }}>
              <T variant="h2">{fmtPace(res.durationSec, km, settings.unit).split(' ')[0]}</T>
              <T variant="small">
                {t('sum.pace')} /{distUnit(settings.unit)}
              </T>
            </Card>
          ) : null}
        </Row>

        {hasDistance ? (
          <Section title={t('sum.distance', { u: distUnit(settings.unit) })}>
            <TextInput value={dist} onChangeText={setDist} keyboardType="decimal-pad" placeholder="5.0" placeholderTextColor={C.faint} style={st.input} />
          </Section>
        ) : null}

        {Object.keys(weights).length ? (
          <Section title={t('sum.weights')}>
            {Object.keys(weights).map((ex) => {
              const e = EXERCISE_BY_ID[ex];
              const kg = weights[ex];
              return (
                <Card key={ex}>
                  <T style={{ fontWeight: '700' }}>{exName(ex, lang)}</T>
                  {e?.equipment === 'kettlebell' && settings.bells.length ? (
                    <Wrap>
                      {settings.bells.map((b) => (
                        <Chip key={b} label={fmtWeight(b, settings.unit)} active={kg === b} onPress={() => setWeights({ ...weights, [ex]: b })} />
                      ))}
                    </Wrap>
                  ) : (
                    <Stepper
                      label={weightUnit(settings.unit)}
                      value={Math.round(fromKg(kg, settings.unit) * 2) / 2}
                      step={settings.unit === 'imperial' ? 5 : 2.5}
                      min={0}
                      max={500}
                      onChange={(v) => setWeights({ ...weights, [ex]: toKg(v, settings.unit) })}
                    />
                  )}
                </Card>
              );
            })}
          </Section>
        ) : null}

        <Section title={t('sum.rpe')}>
          <Wrap gap={6}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Chip key={n} label={`${n}`} active={rpe === n} onPress={() => setRpe(rpe === n ? undefined : n)} color={n >= 9 ? C.danger : n >= 7 ? C.accent : C.good} />
            ))}
          </Wrap>
        </Section>

        <Section title={t('sum.note')}>
          <TextInput value={note} onChangeText={setNote} placeholder={t('sum.notePh')} placeholderTextColor={C.faint} style={[st.input, { minHeight: 70 }]} multiline />
        </Section>

        <Button label={t('sum.save')} icon="check" big onPress={save} />
        <Button label={t('sum.discard')} variant="ghost" onPress={discard} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  badge: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' },
  input: { backgroundColor: C.surface, color: C.text, borderRadius: 14, padding: 14, fontSize: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
});
