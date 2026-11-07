import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { EQUIP_ICON } from '@/components/Pickers';
import { Button, Card, Group, ListRow, Row, Screen, SelectSheet, SwitchRow, T, type IconName, type Option } from '@/components/ui';
import { DISCIPLINES, EQUIPMENT } from '@/data/exercises';
import { POWERED_BY, SUPPORT_URL } from '@/lib/config';
import { LANG_NAMES } from '@/lib/i18n';
import { ensureNotificationPermission, useStore } from '@/lib/store';
import { C, DISC_COLOR, DISC_ICON } from '@/lib/theme';
import type { Discipline, Equipment, Lang, Settings } from '@/lib/types';
import { STANDARD_BELLS, fmtWeight } from '@/lib/units';

type SheetId = 'lang' | 'unit' | 'disc' | 'equip' | 'bells' | 'days' | 'goal' | 'time' | null;

const pad = (n: number) => String(n).padStart(2, '0');
const TIMES = Array.from({ length: 36 }, (_, i) => 5 * 60 + i * 30); // 05:00 – 22:30

/** "A, B +2" – a short summary of a multi-choice value. */
function summary(labels: string[], none: string) {
  if (!labels.length) return none;
  return labels.length <= 2 ? labels.join(', ') : `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
}

export default function SettingsScreen() {
  const { t, lang, settings, updateSettings, resetAll, account } = useStore();
  const [sheet, setSheet] = useState<SheetId>(null);
  const close = () => setSheet(null);
  const r = settings.reminder;
  const set = (patch: Partial<Settings>) => updateSettings(patch);
  const webLang = lang === 'cs' || lang === 'nb' ? lang : 'en';

  const langOpts: Option<Lang | 'auto'>[] = [{ value: 'auto', label: t('set.auto') }, ...(Object.keys(LANG_NAMES) as Lang[]).map((l) => ({ value: l, label: LANG_NAMES[l] }))];
  const unitOpts: Option<Settings['unit']>[] = [
    { value: 'metric', label: t('set.metric') },
    { value: 'imperial', label: t('set.imperial') },
  ];
  const discOpts: Option<Discipline>[] = DISCIPLINES.map((d: Discipline) => ({ value: d, label: t(`disc.${d}` as 'disc.gym'), icon: DISC_ICON[d] as IconName, color: DISC_COLOR[d] }));
  const equipOpts: Option<Equipment>[] = EQUIPMENT.map((e: Equipment) => ({ value: e, label: t(`equip.${e}` as 'equip.none'), icon: EQUIP_ICON[e] }));
  const bellOpts: Option<number>[] = STANDARD_BELLS.map((kg) => ({ value: kg, label: fmtWeight(kg, settings.unit) }));
  const dayOpts: Option<number>[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: t(`wd.${d}` as 'wd.0') }));
  const goalOpts: Option<number>[] = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: n, label: t('set.perWeek', { n }) }));
  const timeOpts: Option<number>[] = TIMES.map((m) => ({ value: m, label: `${pad(Math.floor(m / 60))}:${pad(m % 60)}` }));
  const label = <V,>(opts: Option<V>[], vals: V[]) => opts.filter((o) => vals.includes(o.value)).map((o) => o.label);
  const none = '—';

  const toggleReminder = async (on: boolean) => {
    if (on && !(await ensureNotificationPermission())) {
      Alert.alert(t('set.reminders'), t('set.denied'));
      return;
    }
    set({ reminder: { ...r, enabled: on } });
  };

  const confirmReset = () =>
    Alert.alert(t('set.reset'), account.email ? t('set.resetSignedIn') : t('set.resetConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('set.reset'), style: 'destructive', onPress: resetAll },
    ]);

  const sheetProps = { onClose: close, doneLabel: t('common.done') };

  return (
    <Screen title={t('tab.settings')}>
      <Group title={t('set.gTraining')}>
        <ListRow icon="run-fast" label={t('set.disciplines')} value={summary(label(discOpts, settings.disciplines), none)} onPress={() => setSheet('disc')} />
        <ListRow icon="dumbbell" iconColor={DISC_COLOR.gym} label={t('set.equipment')} value={summary(label(equipOpts, settings.equipment), none)} onPress={() => setSheet('equip')} />
        {settings.equipment.includes('kettlebell') ? (
          <ListRow icon="kettlebell" iconColor={DISC_COLOR.kettlebell} label={t('set.bells')} value={summary(label(bellOpts, settings.bells), none)} onPress={() => setSheet('bells')} />
        ) : null}
        <ListRow icon="calendar-week" iconColor={C.rest} label={t('set.trainingDays')} value={summary(label(dayOpts, settings.trainingDays), none)} onPress={() => setSheet('days')} />
        <ListRow icon="flag-checkered" iconColor={C.good} label={t('set.goal')} value={t('set.perWeek', { n: settings.weeklyGoal })} onPress={() => setSheet('goal')} />
      </Group>

      <Group title={t('set.gCoach')}>
        <SwitchRow icon="account-voice" iconColor={DISC_COLOR.mobility} label={t('set.voice')} hint={t('set.voiceHint')} value={settings.voice} onChange={(v) => set({ voice: v })} />
        <SwitchRow icon="vibrate" iconColor={DISC_COLOR.calisthenics} label={t('set.sound')} value={settings.sound} onChange={(v) => set({ sound: v })} />
        <SwitchRow icon="bell-ring-outline" iconColor={DISC_COLOR.gym} label={t('set.reminders')} hint={t('set.remindersHint')} value={r.enabled} onChange={toggleReminder} />
        {r.enabled ? <ListRow icon="clock-outline" iconColor={C.muted} label={t('set.time')} value={`${pad(r.hour)}:${pad(r.minute)}`} onPress={() => setSheet('time')} /> : null}
      </Group>

      <Group title={t('set.gApp')}>
        <ListRow icon="translate" iconColor={C.rest} label={t('set.language')} value={settings.lang === 'auto' ? t('set.auto') : LANG_NAMES[settings.lang]} onPress={() => setSheet('lang')} />
        <ListRow icon="ruler" iconColor={C.muted} label={t('set.units')} value={settings.unit === 'metric' ? 'kg, km' : 'lb, mi'} onPress={() => setSheet('unit')} />
        <ListRow icon={account.email ? 'cloud-check-outline' : 'cloud-outline'} label={t('acc.title')} value={account.email ?? t('acc.notSignedIn')} onPress={() => router.push('/account')} />
      </Group>

      {SUPPORT_URL ? (
        <Card style={{ gap: 10, borderWidth: 1, borderColor: C.accentDim }}>
          <Row gap={10}>
            <T style={{ fontSize: 22 }}>❤️</T>
            <T variant="h3" style={{ flex: 1 }}>
              {t('set.support').replace(' ❤️', '')}
            </T>
          </Row>
          <T variant="muted">{t('set.supportHint')}</T>
          <Button label={t('set.supportBtn')} icon="hand-heart-outline" onPress={() => Linking.openURL(`${SUPPORT_URL}?lang=${webLang}`).catch(() => {})} style={{ alignSelf: 'flex-start', marginTop: 2 }} />
        </Card>
      ) : null}

      <Group title={t('set.about')} footer={t('set.disclaimer')}>
        <ListRow icon="shield-lock-outline" iconColor={C.muted} label={t('acc.privacy')} onPress={() => Linking.openURL(`${SUPPORT_URL}?lang=${webLang}#privacy`).catch(() => {})} />
        <ListRow icon="lightning-bolt-outline" iconColor={C.muted} label="Powered by" value={POWERED_BY.name} onPress={() => Linking.openURL(POWERED_BY.url).catch(() => {})} />
        <ListRow icon="information-outline" iconColor={C.muted} label="Varde Fitness" value={`${Constants.expoConfig?.version ?? ''} · CIE AS`} />
      </Group>

      <Group>
        <ListRow icon="trash-can-outline" label={t('set.reset')} danger onPress={confirmReset} chevron={false} />
      </Group>
      <View style={{ height: 4 }} />

      <SelectSheet {...sheetProps} visible={sheet === 'lang'} title={t('set.language')} options={langOpts} selected={[settings.lang]} onChange={([v]) => set({ lang: v })} />
      <SelectSheet {...sheetProps} visible={sheet === 'unit'} title={t('set.units')} options={unitOpts} selected={[settings.unit]} onChange={([v]) => set({ unit: v })} />
      <SelectSheet {...sheetProps} visible={sheet === 'disc'} multi title={t('set.disciplines')} options={discOpts} selected={settings.disciplines} onChange={(v) => set({ disciplines: v })} />
      <SelectSheet {...sheetProps} visible={sheet === 'equip'} multi title={t('set.equipment')} options={equipOpts} selected={settings.equipment} onChange={(v) => set({ equipment: v })} />
      <SelectSheet {...sheetProps} visible={sheet === 'bells'} multi title={t('set.bells')} options={bellOpts} selected={settings.bells} onChange={(v) => set({ bells: [...v].sort((a, b) => a - b) })} />
      <SelectSheet {...sheetProps} visible={sheet === 'days'} multi title={t('set.trainingDays')} options={dayOpts} selected={settings.trainingDays} onChange={(v) => set({ trainingDays: [...v].sort((a, b) => a - b) })} />
      <SelectSheet {...sheetProps} visible={sheet === 'goal'} title={t('set.goal')} options={goalOpts} selected={[settings.weeklyGoal]} onChange={([v]) => set({ weeklyGoal: v })} />
      <SelectSheet
        {...sheetProps}
        visible={sheet === 'time'}
        title={t('set.time')}
        options={timeOpts}
        selected={[r.hour * 60 + r.minute]}
        onChange={([m]) => set({ reminder: { ...r, hour: Math.floor(m / 60), minute: m % 60 } })}
      />
    </Screen>
  );
}
