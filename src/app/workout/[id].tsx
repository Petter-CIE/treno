import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import { ExerciseAnimation } from '@/components/ExerciseAnimation';
import { Button, Card, DiscBadge, Icon, Row, Screen, T, Wrap } from '@/components/ui';
import { WORKOUT_BY_ID } from '@/data/programs';
import { fmtDate, today } from '@/lib/dates';
import { LANG_TAG, pick } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';
import type { Equipment } from '@/lib/types';
import { blockTitle, itemText, workoutEquipment } from '@/lib/workout';

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, addPlan, settings } = useStore();
  const w = WORKOUT_BY_ID[id];
  if (!w) return <Screen title="?" />;
  const eq = workoutEquipment(w) as Equipment[];
  const missing = eq.filter((e) => settings.onboarded && !settings.equipment.includes(e));

  return (
    <Screen
      title={pick(w.name, lang)}
      right={
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('common.back')}>
          <Icon name="close" size={26} />
        </Pressable>
      }
    >
      <Wrap>
        <DiscBadge d={w.discipline} label={t(`disc.${w.discipline}` as 'disc.gym')} />
        <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 99, backgroundColor: C.surface2 }}>
          <T variant="small">
            ~{w.minutes} {t('common.min')}
          </T>
        </View>
        {eq.map((e) => (
          <View key={e} style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 99, backgroundColor: missing.includes(e) ? C.dangerDim : C.surface2 }}>
            <T variant="small" style={missing.includes(e) ? { color: C.danger } : undefined}>
              {t(`equip.${e}` as 'equip.none')}
            </T>
          </View>
        ))}
      </Wrap>
      <T variant="muted">{pick(w.focus, lang)}</T>

      {w.blocks.map((b, i) => (
        <Card key={i}>
          <T variant="label">{blockTitle(b, t)}</T>
          {b.kind === 'emom' && b.items.length > 1 ? <T variant="small">{t('block.alternating')}</T> : null}
          {b.items.map((it, j) => (
            <Pressable key={j} onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: it.ex } })}>
              <Row style={{ justifyContent: 'space-between', paddingVertical: 2 }} gap={10}>
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: C.bg, overflow: 'hidden' }}>
                  <ExerciseAnimation id={it.ex} size={44} playing={false} />
                </View>
                <T style={{ fontWeight: '600', flex: 1 }}>{itemText(it, lang, t, b.kind === 'interval' || b.kind === 'steady')}</T>
                <Icon name="information-outline" color={C.faint} size={18} />
              </Row>
            </Pressable>
          ))}
        </Card>
      ))}

      <Button label={t('common.start')} icon="play" big onPress={() => router.push({ pathname: '/timer', params: { w: w.id } })} />
      <Button
        label={`${t('plan.add')} · ${t('common.today')}`}
        variant="secondary"
        icon="calendar-month"
        onPress={() => {
          addPlan(today(), w.id);
          Alert.alert(t('plan.add'), `${pick(w.name, lang)} → ${fmtDate(today(), LANG_TAG[lang])}`);
        }}
      />
    </Screen>
  );
}
