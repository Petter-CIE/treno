import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Icon, Row, T } from '@/components/ui';
import { WORKOUT_BY_ID } from '@/data/programs';
import { fmtDuration } from '@/lib/dates';
import { LANG_TAG, pick } from '@/lib/i18n';
import { session } from '@/lib/session';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';
import { buildSteps, type Step } from '@/lib/workout';

const RING = 260;
const STROKE = 14;

export default function TimerScreen() {
  useKeepAwake();
  const { w: wid } = useLocalSearchParams<{ w: string }>();
  const { t, lang, settings } = useStore();
  const insets = useSafeAreaInsets();

  const workout = useMemo(() => (wid === 'custom' ? session.takeWorkout() : WORKOUT_BY_ID[wid]), [wid]);
  const steps = useMemo(() => (workout ? buildSteps(workout, lang, t) : []), [workout, lang, t]);

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const startedAt = useRef(0);
  const pausedMs = useRef(0);
  const pausedAt = useRef<number | null>(null);
  const finished = useRef(false);

  const say = useCallback(
    (text: string, rate = 1) => {
      if (!settings.voice || !text) return;
      Speech.stop();
      Speech.speak(text, { language: LANG_TAG[lang], rate });
    },
    [settings.voice, lang],
  );
  const buzz = useCallback(
    (strong = false) => {
      if (!settings.sound || Platform.OS === 'web') return;
      if (strong) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    },
    [settings.sound],
  );

  // total workout clock
  useEffect(() => {
    startedAt.current = Date.now();
    const h = setInterval(() => {
      if (pausedAt.current) return;
      setElapsed(Math.round((Date.now() - startedAt.current - pausedMs.current) / 1000));
    }, 500);
    return () => {
      clearInterval(h);
      Speech.stop();
    };
  }, []);

  const finish = useCallback(
    (completed: boolean) => {
      if (finished.current || !workout) return;
      finished.current = true;
      if (completed) {
        say(t('timer.voiceDone'));
        buzz(true);
      } else Speech.stop();
      const durationSec = Math.round((Date.now() - startedAt.current - pausedMs.current) / 1000);
      session.setResult({ workout, durationSec, rounds: rounds || undefined, completed });
      router.replace('/summary');
    },
    [workout, rounds, say, buzz, t],
  );

  const goNext = useCallback(() => {
    if (idx >= steps.length - 1) finish(true);
    else setIdx(idx + 1);
  }, [idx, steps.length, finish]);

  const togglePause = () => {
    if (paused) {
      if (pausedAt.current) pausedMs.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
      setPaused(false);
    } else {
      pausedAt.current = Date.now();
      setPaused(true);
      Speech.stop();
    }
  };

  const quit = () => {
    if (!paused) togglePause();
    Alert.alert(t('timer.quit'), t('timer.quitText'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('timer.quitDiscard'), style: 'destructive', onPress: () => router.back() },
      { text: t('timer.quitSave'), onPress: () => finish(false) },
    ]);
  };

  const step: Step | undefined = steps[idx];
  const next: Step | undefined = steps[idx + 1];

  if (!workout || !step)
    return (
      <View style={[st.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Pressable onPress={() => router.back()}>
          <T>{t('common.back')}</T>
        </Pressable>
      </View>
    );

  return (
    <View style={[st.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: 16 }}>
        <Pressable onPress={quit} hitSlop={12} accessibilityLabel={t('timer.quit')}>
          <Icon name="close" size={28} />
        </Pressable>
        <T variant="muted" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          {pick(workout.name, lang)}
        </T>
        <T variant="muted" style={{ fontVariant: ['tabular-nums'] }}>
          {fmtDuration(elapsed)}
        </T>
      </Row>

      <View style={st.track}>
        <View style={[st.trackFill, { width: `${(idx / steps.length) * 100}%` }]} />
      </View>

      {/* keyed by step index: a fresh countdown for every step */}
      <StepView
        key={idx}
        step={step}
        first={idx === 0}
        paused={paused}
        rounds={rounds}
        onRound={() => {
          setRounds((n) => n + 1);
          buzz();
        }}
        onDone={goNext}
        say={say}
        buzz={buzz}
      />

      {next ? (
        <View style={st.next}>
          <T variant="small">{t('timer.next')}</T>
          <T style={{ fontWeight: '700' }} numberOfLines={1}>
            {next.kind === 'rest' ? `${next.title} · ${next.seconds} s` : next.title}
          </T>
        </View>
      ) : null}

      {step.kind === 'manual' ? (
        <Pressable style={st.doneBtn} onPress={goNext} accessibilityRole="button">
          <Icon name="check" size={28} color="#0D1F14" />
          <Text style={st.doneText}>{t('timer.setDone')}</Text>
        </Pressable>
      ) : null}

      <Row style={{ justifyContent: 'center', gap: 28, marginTop: 14 }}>
        <Pressable style={st.ctrl} onPress={() => idx > 0 && setIdx(idx - 1)} accessibilityLabel="previous">
          <Icon name="skip-previous" size={28} color={idx > 0 ? C.text : C.faint} />
        </Pressable>
        <Pressable style={[st.ctrl, st.ctrlMain]} onPress={togglePause} accessibilityLabel={paused ? t('timer.resume') : t('timer.pause')}>
          <Icon name={paused ? 'play' : 'pause'} size={36} color="#1A0E07" />
        </Pressable>
        <Pressable style={st.ctrl} onPress={goNext} accessibilityLabel={t('timer.skip')}>
          <Icon name="skip-next" size={28} />
        </Pressable>
      </Row>
    </View>
  );
}

function StepView({
  step,
  first,
  paused,
  rounds,
  onRound,
  onDone,
  say,
  buzz,
}: {
  step: Step;
  first: boolean;
  paused: boolean;
  rounds: number;
  onRound: () => void;
  onDone: () => void;
  say: (text: string, rate?: number) => void;
  buzz: (strong?: boolean) => void;
}) {
  const { t } = useStore();
  const [remaining, setRemaining] = useState(step.seconds);
  const [up, setUp] = useState(0); // count-up for manual sets
  const leftMs = useRef(step.seconds * 1000);
  const upMs = useRef(0);
  const lastSpoken = useRef<number | null>(null);
  const halfSaid = useRef(false);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // announce the step once
  useEffect(() => {
    say(step.say);
    if (!first) buzz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused) return;
    let last = Date.now();
    const h = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      if (step.seconds === 0) {
        upMs.current += dt;
        setUp(Math.floor(upMs.current / 1000));
        return;
      }
      leftMs.current -= dt;
      const left = Math.max(0, Math.ceil(leftMs.current / 1000));
      setRemaining(left);
      if (left <= 3 && left >= 1 && lastSpoken.current !== left) {
        lastSpoken.current = left;
        say(String(left), 1.1);
        buzz();
      }
      if (!halfSaid.current && step.seconds >= 120 && step.kind !== 'prep' && left <= step.seconds / 2 && left > 5) {
        halfSaid.current = true;
        say(t('timer.voiceHalf'));
      }
      if (leftMs.current <= 0 && !done.current) {
        done.current = true;
        onDoneRef.current();
      }
    }, 200);
    return () => clearInterval(h);
  }, [paused, step, say, buzz, t]);

  const color = step.kind === 'rest' ? C.rest : step.kind === 'prep' ? C.muted : step.kind === 'manual' ? C.good : C.accent;
  const progress = step.seconds ? 1 - remaining / step.seconds : 0;
  const r = (RING - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const kindLabel =
    step.kind === 'rest' ? (step.walk ? t('timer.walk') : t('timer.rest')) : step.kind === 'prep' ? t('timer.ready') : step.kind === 'amrap' ? 'AMRAP' : t('timer.work');

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 20 }}>
      <Text style={[st.kind, { color }]}>{kindLabel.toUpperCase()}</Text>
      <Text style={st.title} numberOfLines={3} adjustsFontSizeToFit>
        {step.title}
      </Text>
      {step.detail ? (
        <T variant="muted" style={{ textAlign: 'center' }}>
          {step.detail}
        </T>
      ) : null}

      <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
          <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={C.surface2} strokeWidth={STROKE} fill="none" />
          {step.seconds ? (
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={r}
              stroke={color}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${circ} ${circ}`}
              strokeDashoffset={circ * progress}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          ) : null}
        </Svg>
        <Text style={st.time}>{fmtDuration(step.seconds ? remaining : up)}</Text>
        {paused ? <T variant="label">{t('timer.pause')}</T> : null}
      </View>

      {step.kind === 'amrap' ? (
        <View style={{ alignItems: 'center', gap: 10, width: '100%' }}>
          {step.items?.map((it) => (
            <T key={it} style={{ fontWeight: '600' }}>
              {it}
            </T>
          ))}
          <Row gap={16}>
            <T variant="h2">
              {t('timer.rounds')}: {rounds}
            </T>
            <Pressable style={st.roundBtn} onPress={onRound}>
              <Text style={st.roundBtnText}>{t('timer.addRound')}</Text>
            </Pressable>
          </Row>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  track: { height: 4, backgroundColor: C.surface2, marginHorizontal: 16, marginTop: 12, borderRadius: 2, overflow: 'hidden' },
  trackFill: { height: 4, backgroundColor: C.accent },
  kind: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  title: { color: C.text, fontSize: 34, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  time: { color: C.text, fontSize: 72, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -2 },
  next: { marginHorizontal: 16, padding: 14, borderRadius: 16, backgroundColor: C.surface, gap: 2 },
  doneBtn: { marginHorizontal: 16, marginTop: 12, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.good, paddingVertical: 18, borderRadius: 99 },
  doneText: { color: '#0D1F14', fontSize: 18, fontWeight: '800' },
  ctrl: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  ctrlMain: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.accent },
  roundBtn: { backgroundColor: C.accent, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 99 },
  roundBtnText: { color: '#1A0E07', fontWeight: '800', fontSize: 16 },
});
