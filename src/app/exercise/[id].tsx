import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ExerciseAnimation } from '@/components/ExerciseAnimation';
import { Card, DiscBadge, Icon, Row, Screen, Section, T, Wrap } from '@/components/ui';
import { ProgressChart } from '@/components/ProgressChart';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { pick } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';
import { fmtWeight } from '@/lib/units';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, log, settings } = useStore();
  const e = EXERCISE_BY_ID[id];
  if (!e) return <Screen title="?" />;

  const best = log.flatMap((l) => l.sets.filter((s) => s.ex === e.id && s.weightKg)).reduce((m, s) => Math.max(m, s.weightKg ?? 0), 0);

  return (
    <Screen
      title={pick(e.name, lang)}
      right={
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('common.back')}>
          <Icon name="close" size={26} />
        </Pressable>
      }
    >
      <Card style={{ alignItems: 'center', paddingVertical: 8 }}>
        <ExerciseAnimation id={e.id} size={240} />
      </Card>

      <Wrap>
        <DiscBadge d={e.discipline} label={t(`disc.${e.discipline}` as 'disc.gym')} />
        <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 99, backgroundColor: C.surface2 }}>
          <T variant="small">{t(`level.${e.level}` as 'level.1')}</T>
        </View>
        <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 99, backgroundColor: C.surface2 }}>
          <T variant="small">{t(`equip.${e.equipment}` as 'equip.none')}</T>
        </View>
      </Wrap>

      <Card>
        <T variant="label">{t('ex.muscles')}</T>
        <T>{pick(e.muscles, lang)}</T>
        {e.unilateral ? (
          <Row style={{ marginTop: 4 }}>
            <Icon name="swap-horizontal" color={C.accent} size={18} />
            <T variant="muted">{t('ex.bothSides')}</T>
          </Row>
        ) : null}
      </Card>

      <Section title={t('ex.technique')}>
        <Card>
          {e.cues[lang].map((c, i) => (
            <Row key={i} style={{ alignItems: 'flex-start' }} gap={12}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                <T style={{ color: C.accent, fontWeight: '800', fontSize: 13 }}>{i + 1}</T>
              </View>
              <T style={{ flex: 1 }}>{c}</T>
            </Row>
          ))}
        </Card>
      </Section>

      {e.weighted ? (
        <Section title={t('log.progress')}>
          <Card>
            {best ? (
              <>
                <T variant="muted">
                  {t('ex.history')}: <T style={{ fontWeight: '800' }}>{fmtWeight(best, settings.unit)}</T>
                </T>
                <ProgressChart exId={e.id} />
              </>
            ) : (
              <T variant="muted">{t('log.noData')}</T>
            )}
          </Card>
        </Section>
      ) : null}

      <Row style={{ alignItems: 'flex-start' }}>
        <Icon name="alert-circle-outline" color={C.faint} size={18} />
        <T variant="small" style={{ flex: 1 }}>
          {t('ex.safety')}
        </T>
      </Row>
    </Screen>
  );
}
