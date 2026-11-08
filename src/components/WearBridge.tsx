import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useStore } from '@/lib/store';
import { logFromWatch, sendPlanToWatch, wear as VardeWear, type WatchLog } from '@/lib/wear';

/** Keeps the Wear OS watch in sync: sends upcoming workouts, takes in workouts finished on the watch. */
export function WearBridge() {
  const { ready, plan, log, settings, lang, t, addLog } = useStore();
  const addRef = useRef(addLog);
  useEffect(() => {
    addRef.current = addLog;
  }, [addLog]);

  // incoming logs: live while the app runs, plus anything that arrived meanwhile
  useEffect(() => {
    if (!VardeWear || !ready) return;
    const mod = VardeWear;
    const take = (json: string) => {
      try {
        const entry = logFromWatch(JSON.parse(json) as WatchLog);
        if (entry) addRef.current(entry);
      } catch {
        // malformed item – ignore
      }
    };
    const collect = () => mod.collectLogs().then((list) => list.forEach(take)).catch(() => {});
    collect();
    const sub = mod.addListener('onLog', ({ json }) => take(json));
    const app = AppState.addEventListener('change', (s) => s === 'active' && collect());
    return () => {
      sub.remove();
      app.remove();
    };
  }, [ready]);

  // outgoing plan (debounced; the Data Layer ignores identical data)
  useEffect(() => {
    if (!VardeWear || !ready) return;
    const h = setTimeout(() => {
      sendPlanToWatch({ plan, log, settings, lang, t });
    }, 1500);
    return () => clearTimeout(h);
  }, [ready, plan, log, settings, lang, t]);

  return null;
}
