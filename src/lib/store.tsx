import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { PROGRAM_BY_ID, programSessionsForWeek } from '@/data/programs';
import { addDays, parseYmd, startOfWeek, today, uid, weekdayMon, ymd } from './dates';
import { translate, type Key } from './i18n';
import { deviceLang } from './locale';
import type { Lang, LogEntry, PlanEntry, Settings } from './types';

const KEY = 'varde:v1';

export interface ActiveProgram {
  id: string;
  start: string; // Monday of week 1
}

interface Data {
  settings: Settings;
  plan: PlanEntry[];
  log: LogEntry[];
  program: ActiveProgram | null;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'auto',
  unit: 'metric',
  disciplines: [],
  equipment: [],
  bells: [8, 12, 16],
  voice: true,
  sound: true,
  weeklyGoal: 3,
  reminder: { enabled: false, hour: 17, minute: 0 },
  trainingDays: [0, 2, 4],
  onboarded: false,
};

const EMPTY: Data = { settings: DEFAULT_SETTINGS, plan: [], log: [], program: null };

interface Store extends Data {
  ready: boolean;
  lang: Lang;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  updateSettings: (patch: Partial<Settings>) => void;
  addPlan: (date: string, workout: string) => void;
  removePlan: (id: string) => void;
  startProgram: (programId: string) => void;
  stopProgram: () => void;
  addLog: (entry: Omit<LogEntry, 'id'>) => void;
  deleteLog: (id: string) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Data>;
          setData({
            ...EMPTY,
            ...parsed,
            settings: { ...DEFAULT_SETTINGS, ...parsed.settings, reminder: { ...DEFAULT_SETTINGS.reminder, ...parsed.settings?.reminder } },
          });
        }
      } catch {
        // corrupted storage → start fresh
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const lang: Lang = data.settings.lang === 'auto' ? deviceLang() : data.settings.lang;
  const t = useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  // keep reminders in sync with settings
  const { reminder, trainingDays } = data.settings;
  useEffect(() => {
    if (!ready) return;
    syncReminders(reminder.enabled, trainingDays, reminder.hour, reminder.minute, t('notif.title'), t('notif.body')).catch(() => {});
  }, [ready, reminder.enabled, reminder.hour, reminder.minute, trainingDays, t]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const addPlan = useCallback((date: string, workout: string) => {
    setData((d) => ({ ...d, plan: [...d.plan, { id: uid(), date, workout }] }));
  }, []);

  const removePlan = useCallback((id: string) => {
    setData((d) => ({ ...d, plan: d.plan.filter((p) => p.id !== id) }));
  }, []);

  const startProgram = useCallback((programId: string) => {
    setData((d) => {
      const program = PROGRAM_BY_ID[programId];
      if (!program) return d;
      const now = new Date();
      // start this week if there is still a training day left, otherwise next Monday
      const days = pickDays(d.settings.trainingDays, program.perWeek);
      const thisMonday = startOfWeek(now);
      const hasDayLeft = days.some((wd) => ymd(addDays(thisMonday, wd)) >= today());
      const start = hasDayLeft ? thisMonday : addDays(thisMonday, 7);
      const entries: PlanEntry[] = [];
      let n = 0;
      for (let w = 0; w < program.weeks; w++) {
        const sessions = programSessionsForWeek(program, w);
        days.forEach((wd, i) => {
          const date = ymd(addDays(start, w * 7 + wd));
          if (date < today()) return;
          const workout = program.weekly ? sessions[i % sessions.length] : sessions[n % sessions.length];
          n++;
          entries.push({ id: uid(), date, workout, programId });
        });
      }
      const plan = d.plan.filter((p) => !(p.programId && p.date >= today()));
      return { ...d, plan: [...plan, ...entries], program: { id: programId, start: ymd(start) } };
    });
  }, []);

  const stopProgram = useCallback(() => {
    setData((d) => ({ ...d, plan: d.plan.filter((p) => !(p.programId && p.date >= today())), program: null }));
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setData((d) => ({ ...d, log: [{ ...entry, id: uid() }, ...d.log] }));
  }, []);

  const deleteLog = useCallback((id: string) => {
    setData((d) => ({ ...d, log: d.log.filter((l) => l.id !== id) }));
  }, []);

  const resetAll = useCallback(() => {
    setData(EMPTY);
    Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  }, []);

  const value = useMemo<Store>(
    () => ({ ...data, ready, lang, t, updateSettings, addPlan, removePlan, startProgram, stopProgram, addLog, deleteLog, resetAll }),
    [data, ready, lang, t, updateSettings, addPlan, removePlan, startProgram, stopProgram, addLog, deleteLog, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

/** Spread a program's sessions over the user's training days. */
export function pickDays(trainingDays: number[], perWeek: number): number[] {
  const sorted = [...new Set(trainingDays)].sort((a, b) => a - b);
  if (sorted.length >= perWeek) {
    // take evenly spaced days from the user's choice
    const step = sorted.length / perWeek;
    return Array.from({ length: perWeek }, (_, i) => sorted[Math.floor(i * step)]);
  }
  const defaults: Record<number, number[]> = { 1: [2], 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  return defaults[Math.min(7, Math.max(1, perWeek))];
}

/** Weeks in a row (ending with this or last week) where the weekly goal was met. */
export function weeklyStreak(log: LogEntry[], goal: number): number {
  const counts = new Map<string, number>();
  for (const l of log) {
    const wk = ymd(startOfWeek(parseYmd(l.date)));
    counts.set(wk, (counts.get(wk) ?? 0) + 1);
  }
  let monday = startOfWeek(new Date());
  let streak = 0;
  // the current week counts only once it is complete
  if ((counts.get(ymd(monday)) ?? 0) >= goal) streak++;
  monday = addDays(monday, -7);
  while ((counts.get(ymd(monday)) ?? 0) >= goal) {
    streak++;
    monday = addDays(monday, -7);
  }
  return streak;
}

export function workoutsThisWeek(log: LogEntry[]): number {
  const monday = ymd(startOfWeek(new Date()));
  const sunday = ymd(addDays(startOfWeek(new Date()), 6));
  return new Set(log.filter((l) => l.date >= monday && l.date <= sunday).map((l) => l.id)).size;
}

async function syncReminders(enabled: boolean, days: number[], hour: number, minute: number, title: string, body: string) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  for (const d of days) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: ((d + 1) % 7) + 1, // expo: 1 = Sunday; ours: 0 = Monday
        hour,
        minute,
        channelId: 'reminders',
      },
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    // eslint-disable-next-line import/namespace
    await Notifications.setNotificationChannelAsync('reminders', { name: 'Reminders', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

export { weekdayMon };
