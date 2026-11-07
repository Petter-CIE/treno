import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, FONT } from '@/lib/theme';

const icon = (name: IconName) =>
  function TabIcon({ color }: { color: unknown }) {
    return <Icon name={name} size={24} color={String(color ?? C.faint)} />;
  };

export default function TabLayout() {
  const { t } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.faint,
        // floating pill tab bar
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: Math.max(insets.bottom, 12),
          marginHorizontal: 16,
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 26,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.tabBar,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        },
        tabBarItemStyle: { height: 52 },
        tabBarIconStyle: { marginBottom: 2 },
        tabBarLabelStyle: { fontFamily: FONT[600], fontSize: 11 },
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
