import { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { ProgressChart, WeeklyBars } from '@/components/ProgressChart';
import { Card, Chip, DiscIcon, Icon, Row, Screen, Section, T } from '@/components/ui';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { addDays, fmtDate, fmtDuration, ymd } from '@/lib/dates';
import { LANG_TAG } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';
import { fmtDistance, fmtPace, fmtVolume, fmtWeight } from '@/lib/units';
import { exName, logTitle } from '@/lib/workout';

export default function LogScreen() {
  const { t, lang, log, settings, deleteLog } = useStore();
  const since = ymd(addDays(new Date(), -30));
  const recent = log.filter((l) => l.date >= since);
  const minutes = Math.round(recent.reduce((s, l) => s + l.durationSec, 0) / 60);
  const km = recent.reduce((s, l) => s + (l.distanceKm ?? 0), 0);
  const volume = recent.reduce((s, l) => s + l.sets.reduce((a, x) => a + (x.weightKg ?? 0) * x.reps * x.sets, 0), 0);

  const weightedEx = useMemo(() => {
    const ids = new Set<string>();
    for (const l of log) for (const s of l.sets) if (s.weightKg && EXERCISE_BY_ID[s.ex]) ids.add(s.ex);
    return [...ids];
  }, [log]);
  const [ex, setEx] = useState<string | null>(null);
  const selected = ex && weightedEx.includes(ex) ? ex : weightedEx[0];

  if (!log.length)
    return (
      <Screen title={t('tab.log')}>
        <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Icon name="chart-line" size={40} color={C.faint} />
          <T variant="muted" style={{ textAlign: 'center' }}>
            {t('log.empty')}
          </T>
        </Card>
      </Screen>
    );

  const stats = [
    { label: t('log.count'), value: `${recent.length}` },
    { label: t('log.time'), value: `${Math.floor(minutes / 60)} h ${minutes % 60} m` },
    km > 0 ? { label: t('log.distance'), value: fmtDistance(km, settings.unit) } : { label: t('log.volume'), value: fmtVolume(volume, settings.unit) },
  ];

  return (
    <Screen title={t('tab.log')}>
      <Section title={t('log.month')}>
        <Row gap={10}>
          {stats.map((s) => (
            <Card key={s.label} style={{ flex: 1, gap: 2, padding: 12 }}>
              <T variant="h2" numberOfLines={1}>
                {s.value}
              </T>
              <T variant="small">{s.label}</T>
            </Card>
          ))}
        </Row>
      </Section>

      <Card>
        <WeeklyBars />
      </Card>

      {selected ? (
        <Section title={t('log.progress')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {weightedEx.map((id) => (
              <Chip key={id} label={exName(id, lang)} active={id === selected} onPress={() => setEx(id)} />
            ))}
          </ScrollView>
          <Card>
            <T variant="muted">{t('log.max')}</T>
            <ProgressChart exId={selected} />
          </Card>
        </Section>
      ) : null}

      <Section title={t('log.history')}>
        {log.map((l) => (
          <Card
            key={l.id}
            onPress={() =>
              Alert.alert(logTitle(l, lang), t('log.deleteConfirm'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('log.delete'), style: 'destructive', onPress: () => deleteLog(l.id) },
              ])
            }
          >
            <Row gap={12}>
              <DiscIcon d={l.discipline} size={36} />
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '700' }} numberOfLines={1}>
                  {logTitle(l, lang)}
                </T>
                <T variant="small">
                  {fmtDate(l.date, LANG_TAG[lang])} · {fmtDuration(l.durationSec)}
                  {l.distanceKm ? ` · ${fmtDistance(l.distanceKm, settings.unit)} · ${fmtPace(l.durationSec, l.distanceKm, settings.unit)}` : ''}
                  {l.rounds ? ` · ${l.rounds} ${t('timer.rounds').toLowerCase()}` : ''}
                  {l.rpe ? ` · RPE ${l.rpe}` : ''}
                </T>
              </View>
            </Row>
            {l.sets.some((s) => s.weightKg) ? (
              <T variant="small" style={{ color: C.muted }}>
                {l.sets
                  .filter((s) => s.weightKg)
                  .map((s) => `${exName(s.ex, lang)} ${fmtWeight(s.weightKg!, settings.unit)}`)
                  .join(' · ')}
              </T>
            ) : null}
            {l.note ? <T variant="muted">“{l.note}”</T> : null}
          </Card>
        ))}
      </Section>
    </Screen>
  );
}
