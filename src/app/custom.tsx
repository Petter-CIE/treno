import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, Icon, Row, Section, Stepper, T, Wrap } from '@/components/ui';
import { EXERCISES, EXERCISE_BY_ID } from '@/data/exercises';
import { pick } from '@/lib/i18n';
import { session } from '@/lib/session';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';
import { customWorkout, type CustomMode } from '@/lib/workout';

const PRESETS: Record<string, { mode: CustomMode; minutes: number; rounds: number; work: number; rest: number }> = {
  tabata: { mode: 'interval', minutes: 4, rounds: 8, work: 20, rest: 10 },
  emom: { mode: 'emom', minutes: 10, rounds: 8, work: 40, rest: 20 },
  amrap: { mode: 'amrap', minutes: 12, rounds: 8, work: 40, rest: 20 },
  custom: { mode: 'interval', minutes: 20, rounds: 6, work: 45, rest: 15 },
};

export default function CustomTimer() {
  const { preset = 'custom' } = useLocalSearchParams<{ preset?: string }>();
  const { t, lang, settings } = useStore();
  const insets = useSafeAreaInsets();
  const p = PRESETS[preset] ?? PRESETS.custom;

  const [mode, setMode] = useState<CustomMode>(p.mode);
  const [minutes, setMinutes] = useState(p.minutes);
  const [rounds, setRounds] = useState(p.rounds);
  const [work, setWork] = useState(p.work);
  const [rest, setRest] = useState(p.rest);
  const [reps, setReps] = useState(10);

  const options = useMemo(() => {
    const ds = settings.disciplines;
    const eq = settings.equipment;
    return EXERCISES.filter((e) => (!ds.length || ds.includes(e.discipline)) && (e.equipment === 'none' || !settings.onboarded || eq.includes(e.equipment))).slice(0, 24);
  }, [settings]);
  const [ex, setEx] = useState(options[0]?.id ?? 'burpee');

  const modes: { m: CustomMode; label: string }[] = [
    { m: 'interval', label: t('custom.interval') },
    { m: 'emom', label: 'EMOM' },
    { m: 'amrap', label: 'AMRAP' },
    { m: 'steady', label: t('custom.steady') },
  ];

  const start = () => {
    const w = customWorkout(mode, { minutes, rounds, work, rest, ex, reps: mode === 'emom' || mode === 'amrap' ? reps : 0 }, EXERCISE_BY_ID[ex]?.discipline ?? 'cardio', t);
    session.setWorkout(w);
    router.replace({ pathname: '/timer', params: { w: 'custom' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 20, gap: 16, paddingBottom: insets.bottom + 100 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="h1">{t('custom.title')}</T>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name="close" size={26} />
          </Pressable>
        </Row>

        <Section title={t('custom.mode')}>
          <Wrap>
            {modes.map((o) => (
              <Chip key={o.m} label={o.label} active={mode === o.m} onPress={() => setMode(o.m)} />
            ))}
          </Wrap>
        </Section>

        <Card style={{ gap: 14 }}>
          {mode === 'interval' ? (
            <>
              <Stepper label={t('custom.rounds')} value={rounds} min={1} max={50} onChange={setRounds} />
              <Stepper label={t('custom.work')} value={work} min={5} max={1800} step={5} onChange={setWork} />
              <Stepper label={t('custom.rest')} value={rest} min={0} max={600} step={5} onChange={setRest} />
            </>
          ) : (
            <Stepper label={t('custom.minutes')} value={minutes} min={1} max={120} onChange={setMinutes} />
          )}
          {mode === 'emom' || mode === 'amrap' ? <Stepper label={t('custom.reps')} value={reps} min={1} max={100} onChange={setReps} /> : null}
        </Card>

        <Section title={t('custom.exercise')}>
          <Wrap>
            {options.map((e) => (
              <Chip key={e.id} label={pick(e.name, lang)} active={ex === e.id} onPress={() => setEx(e.id)} />
            ))}
          </Wrap>
        </Section>
      </ScrollView>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
        <Button label={t('custom.start')} icon="play" big onPress={start} />
      </View>
    </View>
  );
}
