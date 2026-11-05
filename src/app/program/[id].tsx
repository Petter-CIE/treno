import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable } from 'react-native';
import { WorkoutCard } from '@/components/WorkoutCard';
import { Button, Card, DiscBadge, Icon, Screen, Section, T, Wrap } from '@/components/ui';
import { PROGRAM_BY_ID, WORKOUT_BY_ID } from '@/data/programs';
import { pick } from '@/lib/i18n';
import { pickDays, useStore } from '@/lib/store';

export default function ProgramDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, startProgram, program, settings } = useStore();
  const p = PROGRAM_BY_ID[id];
  if (!p) return <Screen title="?" />;
  const ids = p.weekly ? p.weekly.flat() : p.sessions;
  const unique = [...new Set(ids)].map((x) => WORKOUT_BY_ID[x]).filter(Boolean);
  const days = pickDays(settings.trainingDays, p.perWeek).map((d) => t(`wd.${d}` as 'wd.0')).join(', ');
  const isActive = program?.id === p.id;

  const start = () => {
    const go = () => {
      startProgram(p.id);
      Alert.alert(t('plan.started'));
      router.back();
    };
    if (program && !isActive) {
      Alert.alert(t('plan.start'), t('plan.stopConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.ok'), onPress: go },
      ]);
    } else go();
  };

  return (
    <Screen
      title={pick(p.name, lang)}
      right={
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('common.back')}>
          <Icon name="close" size={26} />
        </Pressable>
      }
    >
      <Wrap>
        <DiscBadge d={p.discipline} label={t(`disc.${p.discipline}` as 'disc.gym')} />
        <DiscBadge d={p.discipline} label={t(`level.${p.level}` as 'level.1')} />
      </Wrap>
      <T>{pick(p.description, lang)}</T>
      <Card>
        <T variant="h3">{t('plan.meta', { weeks: p.weeks, perWeek: p.perWeek })}</T>
        <T variant="muted">{days}</T>
        {p.equipment.length ? <T variant="small">{t('plan.needs', { eq: p.equipment.map((e) => t(`equip.${e}` as 'equip.none')).join(', ') })}</T> : null}
      </Card>
      <Button label={isActive ? t('plan.active') : t('plan.start')} icon="play" big disabled={isActive} onPress={start} />
      <Section title={t('plan.workouts')}>
        {unique.map((w) => (
          <WorkoutCard key={w.id} w={w} compact />
        ))}
      </Section>
    </Screen>
  );
}
