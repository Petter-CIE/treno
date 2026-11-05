import { Tabs } from 'expo-router/js-tabs';
import { Icon, type IconName } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C } from '@/lib/theme';

const icon = (name: IconName) =>
  function TabIcon({ color }: { color: unknown }) {
    return <Icon name={name} size={24} color={String(color ?? C.faint)} />;
  };

export default function TabLayout() {
  const { t } = useStore();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.faint,
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tab.today'), tabBarIcon: icon('home-variant') }} />
      <Tabs.Screen name="plan" options={{ title: t('tab.plan'), tabBarIcon: icon('calendar-month') }} />
      <Tabs.Screen name="exercises" options={{ title: t('tab.exercises'), tabBarIcon: icon('arm-flex') }} />
      <Tabs.Screen name="log" options={{ title: t('tab.log'), tabBarIcon: icon('chart-line') }} />
      <Tabs.Screen name="settings" options={{ title: t('tab.settings'), tabBarIcon: icon('cog') }} />
    </Tabs>
  );
}
