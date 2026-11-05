import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellPicker, DayPicker, DisciplinePicker, EquipmentPicker } from '@/components/Pickers';
import { Button, Card, Row, Stepper, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';

export default function Onboarding() {
  const { t, settings, updateSettings } = useStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const finish = () => {
    updateSettings({ onboarded: true });
    router.back();
  };

  const steps = [
    { title: t('onb.title'), text: t('onb.text'), body: <DisciplinePicker /> },
    {
      title: t('onb.equipTitle'),
      text: t('onb.equipText'),
      body: (
        <View style={{ gap: 16 }}>
          <EquipmentPicker />
          {settings.equipment.includes('kettlebell') ? (
            <View style={{ gap: 8 }}>
              <T variant="label">{t('set.bells')}</T>
              <BellPicker />
            </View>
          ) : null}
        </View>
      ),
    },
    {
      title: t('onb.daysTitle'),
      text: t('onb.daysText'),
      body: (
        <View style={{ gap: 16 }}>
          <DayPicker />
          <Card>
            <Stepper label={t('set.goal')} value={settings.weeklyGoal} min={1} max={7} onChange={(v) => updateSettings({ weeklyGoal: v })} />
          </Card>
        </View>
      ),
    },
  ];
  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
      <Row style={{ paddingHorizontal: 16, gap: 6 }}>
        {steps.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? C.accent : C.surface2 }} />
        ))}
      </Row>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <T variant="h1">{cur.title}</T>
        <T variant="muted">{cur.text}</T>
        {cur.body}
      </ScrollView>
      <Row style={{ paddingHorizontal: 16, gap: 10 }}>
        <Button label={step ? t('common.back') : t('onb.skip')} variant="ghost" onPress={() => (step ? setStep(step - 1) : finish())} />
        <Button label={last ? t('onb.done') : t('onb.next')} style={{ flex: 1 }} big onPress={() => (last ? finish() : setStep(step + 1))} />
      </Row>
    </View>
  );
}
