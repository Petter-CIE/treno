import Constants from 'expo-constants';
import { Alert, Linking, Switch, View } from 'react-native';
import { BellPicker, DayPicker, DisciplinePicker, EquipmentPicker } from '@/components/Pickers';
import { Button, Card, Chip, Divider, Row, Screen, Section, Stepper, T, Wrap } from '@/components/ui';
import { SUPPORT_URL } from '@/lib/config';
import { LANG_NAMES } from '@/lib/i18n';
import { ensureNotificationPermission, useStore } from '@/lib/store';
import { C } from '@/lib/theme';
import type { Lang } from '@/lib/types';

export default function SettingsScreen() {
  const { t, lang, settings, updateSettings, resetAll } = useStore();
  const r = settings.reminder;

  const toggleReminder = async (on: boolean) => {
    if (on) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert(t('set.reminders'), t('set.denied'));
        return;
      }
    }
    updateSettings({ reminder: { ...r, enabled: on } });
  };

  return (
    <Screen title={t('tab.settings')}>
      <Section title={t('set.language')}>
        <Wrap>
          <Chip label={t('set.auto')} active={settings.lang === 'auto'} onPress={() => updateSettings({ lang: 'auto' })} />
          {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
            <Chip key={l} label={LANG_NAMES[l]} active={settings.lang === l} onPress={() => updateSettings({ lang: l })} />
          ))}
        </Wrap>
      </Section>

      <Section title={t('set.units')}>
        <Wrap>
          <Chip label={t('set.metric')} active={settings.unit === 'metric'} onPress={() => updateSettings({ unit: 'metric' })} />
          <Chip label={t('set.imperial')} active={settings.unit === 'imperial'} onPress={() => updateSettings({ unit: 'imperial' })} />
        </Wrap>
      </Section>

      <Section title={t('set.disciplines')}>
        <DisciplinePicker />
      </Section>

      <Section title={t('set.equipment')}>
        <EquipmentPicker />
      </Section>

      {settings.equipment.includes('kettlebell') ? (
        <Section title={t('set.bells')}>
          <T variant="small">{t('set.bellsHint')}</T>
          <BellPicker />
        </Section>
      ) : null}

      <Section title={t('set.trainingDays')}>
        <DayPicker />
        <Card>
          <Stepper label={t('set.goal')} value={settings.weeklyGoal} min={1} max={7} onChange={(v) => updateSettings({ weeklyGoal: v })} />
        </Card>
      </Section>

      <Card style={{ gap: 14 }}>
        <SwitchRow label={t('set.voice')} hint={t('set.voiceHint')} value={settings.voice} onChange={(v) => updateSettings({ voice: v })} />
        <Divider />
        <SwitchRow label={t('set.sound')} value={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
        <Divider />
        <SwitchRow label={t('set.reminders')} hint={t('set.remindersHint')} value={r.enabled} onChange={toggleReminder} />
        {r.enabled ? (
          <>
            <Stepper label={`${t('set.time')} (h)`} value={r.hour} min={0} max={23} onChange={(v) => updateSettings({ reminder: { ...r, hour: v } })} />
            <Stepper label={`${t('set.time')} (min)`} value={r.minute} min={0} max={45} step={15} onChange={(v) => updateSettings({ reminder: { ...r, minute: v } })} />
          </>
        ) : null}
      </Card>

      {SUPPORT_URL ? (
        <Card style={{ borderColor: C.accent }}>
          <T variant="h3">{t('set.support')}</T>
          <T variant="muted">{t('set.supportHint')}</T>
          <Button label={t('set.support')} icon="heart" onPress={() => Linking.openURL(`${SUPPORT_URL}?lang=${lang === 'cs' || lang === 'nb' ? lang : 'en'}`).catch(() => {})} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
        </Card>
      ) : null}

      <Section title={t('set.about')}>
        <T variant="small">{t('set.disclaimer')}</T>
        <T variant="small">Treno {Constants.expoConfig?.version ?? ''} · CIE AS</T>
      </Section>

      <Button
        label={t('set.reset')}
        variant="danger"
        icon="trash-can-outline"
        onPress={() =>
          Alert.alert(t('set.reset'), t('set.resetConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('set.reset'), style: 'destructive', onPress: resetAll },
          ])
        }
      />
    </Screen>
  );
}

function SwitchRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: '600' }}>{label}</T>
        {hint ? <T variant="small">{hint}</T> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.accent, false: C.surface2 }} thumbColor="#fff" />
    </Row>
  );
}
