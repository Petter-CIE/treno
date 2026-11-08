import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { Group, ListRow, SwitchRow } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, DISC_COLOR } from '@/lib/theme';
import { sendPlanToWatch, watchSyncOn, wear } from '@/lib/wear';

/** Settings group for the Wear OS watch link. Renders nothing where the link doesn't exist (iOS, web, Expo Go). */
export function WatchSettings() {
  const { t, plan, log, settings, lang, updateSettings } = useStore();
  const [watches, setWatches] = useState<string[] | null>(null);
  const on = watchSyncOn(settings);

  const refresh = useCallback(() => {
    wear?.connectedWatches().then(setWatches).catch(() => setWatches([]));
  }, []);
  useFocusEffect(refresh);

  if (!wear) return null;

  const sendNow = async () => {
    const list = await wear!.connectedWatches().catch(() => [] as string[]);
    setWatches(list);
    if (!list.length) {
      Alert.alert(t('set.gWatch'), t('set.watchMissing'));
      return;
    }
    const ok = await sendPlanToWatch({ plan, log, settings, lang, t });
    Alert.alert(t('set.gWatch'), ok ? t('set.watchSent') : t('set.watchMissing'));
  };

  const status = watches === null ? '…' : watches.length ? watches.join(', ') : t('set.watchNone');

  return (
    <Group title={t('set.gWatch')}>
      <SwitchRow icon="watch-variant" iconColor={DISC_COLOR.running} label={t('set.watchSync')} hint={t('set.watchSyncHint')} value={on} onChange={(v) => updateSettings({ watchSync: v })} />
      <ListRow icon={watches?.length ? 'watch-vibrate' : 'watch-variant'} iconColor={watches?.length ? C.good : C.muted} label={t('set.watchConnected')} value={status} onPress={refresh} chevron={false} />
      {on ? <ListRow icon="send-outline" iconColor={C.accent} label={t('set.watchSend')} onPress={sendNow} chevron={false} /> : null}
    </Group>
  );
}
