import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { PROGRAM_BY_ID, programSessionsForWeek } from '@/data/programs';
import { addDays, parseYmd, startOfWeek, today, uid, weekdayMon, ymd } from './dates';
import { translate, type Key } from './i18n';
import { deviceLang } from './locale';
import { googleIdToken, googleSignOut } from './google';
import { supabase } from './supabase';
import { fingerprint, merge, type ActiveProgram, type Data } from './sync';
import type { Lang, LogEntry, PlanEntry, Settings } from './types';

const KEY = 'varde:v1';

export type { ActiveProgram };

export interface Account {
  email: string | null; // null = not signed in
  syncing: boolean;
  lastSync: number | null;
  error: boolean;
}

const LAST_SYNC_KEY = 'varde:lastSync';

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
  equipV: 2,
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
  /** pass an id to make the add idempotent (watch logs) */
  addLog: (entry: Omit<LogEntry, 'id'> & { id?: string }) => void;
  deleteLog: (id: string) => void;
  resetAll: () => void;
  account: Account;
  sendCode: (email: string) => Promise<boolean>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  /** 'ok' | 'cancel' | 'error' */
  signInGoogle: () => Promise<'ok' | 'cancel' | 'error'>;
  syncNow: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}

export const EQUIP_V = 2;

/** v1 had no dip bars, jump rope or cardio machines – keep exercises that used to need nothing available. */
export function migrateSettings(s: Settings): Settings {
  if ((s.equipV ?? 1) >= EQUIP_V) return s;
  const eq = new Set(s.equipment);
  if (s.onboarded) eq.add('jumprope');
  if (eq.has('pullupbar')) eq.add('dipbars');
  if (eq.has('machine')) eq.add('cardio');
  return { ...s, equipment: [...eq], equipV: EQUIP_V };
}

/** Remove entries and remember their ids, so the backup does not bring them back. */
function tombstone(d: Data, ids: string[]): Record<string, number> {
  const at = Date.now();
  const deleted = { ...d.deleted };
  for (const id of ids) deleted[id] = at;
  return deleted;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);
  const dataRef = useRef(data);
  const [account, setAccount] = useState<Account>({ email: null, syncing: false, lastSync: null, error: false });
  const syncedPrint = useRef<string | null>(null);
  const syncing = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Data>;
          setData({
            ...EMPTY,
            ...parsed,
            settings: migrateSettings({ ...DEFAULT_SETTINGS, ...parsed.settings, reminder: { ...DEFAULT_SETTINGS.reminder, ...parsed.settings?.reminder } }),
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
    dataRef.current = data;
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
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch }, settingsAt: Date.now() }));
  }, []);

  const addPlan = useCallback((date: string, workout: string) => {
    setData((d) => ({ ...d, plan: [...d.plan, { id: uid(), date, workout }] }));
  }, []);

  const removePlan = useCallback((id: string) => {
    setData((d) => ({ ...d, plan: d.plan.filter((p) => p.id !== id), deleted: tombstone(d, [id]) }));
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
      const drop = d.plan.filter((p) => p.programId && p.date >= today());
      const plan = d.plan.filter((p) => !drop.includes(p));
      return { ...d, plan: [...plan, ...entries], program: { id: programId, start: ymd(start) }, programAt: Date.now(), deleted: tombstone(d, drop.map((p) => p.id)) };
    });
  }, []);

  const stopProgram = useCallback(() => {
    setData((d) => {
      const drop = d.plan.filter((p) => p.programId && p.date >= today());
      return { ...d, plan: d.plan.filter((p) => !drop.includes(p)), program: null, programAt: Date.now(), deleted: tombstone(d, drop.map((p) => p.id)) };
    });
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, 'id'> & { id?: string }) => {
    setData((d) => {
      if (entry.id && (d.log.some((l) => l.id === entry.id) || d.deleted?.[entry.id])) return d;
      return { ...d, log: [{ ...entry, id: entry.id ?? uid() }, ...d.log] };
    });
  }, []);

  const deleteLog = useCallback((id: string) => {
    setData((d) => ({ ...d, log: d.log.filter((l) => l.id !== id), deleted: tombstone(d, [id]) }));
  }, []);

  // ── optional account + backup ──────────────────────────────────────────
  /** Pull the backup, merge it with this phone, push the result. Safe to call any time. */
  const syncNow = useCallback(async () => {
    if (syncing.current || !loaded.current) return;
    const { data: auth } = await supabase.auth.getSession();
    const user = auth.session?.user;
    if (!user) return;
    syncing.current = true;
    setAccount((a) => ({ ...a, syncing: true }));
    try {
      const { data: row, error } = await supabase.from('user_data').select('data').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      const remote = (row?.data ?? null) as Partial<Data> | null;
      const merged = merge(dataRef.current, remote);
      if (fingerprint(merged) !== fingerprint(dataRef.current)) {
        dataRef.current = merged;
        setData((cur) => merge(cur, remote));
      }
      const print = fingerprint(merged);
      const remotePrint = remote ? fingerprint({ ...EMPTY, deleted: {}, ...remote } as Data) : null;
      if (print !== remotePrint) {
        const { error: upErr } = await supabase.from('user_data').upsert({ user_id: user.id, data: merged, updated_at: new Date().toISOString() });
        if (upErr) throw upErr;
      }
      syncedPrint.current = print;
      const at = Date.now();
      AsyncStorage.setItem(LAST_SYNC_KEY, String(at)).catch(() => {});
      setAccount((a) => ({ ...a, syncing: false, lastSync: at, error: false }));
    } catch {
      setAccount((a) => ({ ...a, syncing: false, error: true }));
    } finally {
      syncing.current = false;
    }
  }, []);

  // session: restore on start, follow sign-in / sign-out
  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY)
      .then((v) => v && setAccount((a) => ({ ...a, lastSync: Number(v) })))
      .catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setAccount((a) => ({ ...a, email: session?.user.email ?? null }));
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) setTimeout(() => syncNow(), 0);
    });
    const app = AppState.addEventListener('change', (s) => s === 'active' && syncNow());
    return () => {
      sub.subscription.unsubscribe();
      app.remove();
    };
  }, [syncNow]);

  // first sync once local data is loaded (the session may have been restored earlier)
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => syncNow(), 0);
    return () => clearTimeout(id);
  }, [ready, syncNow]);

  // back up a few seconds after each change
  useEffect(() => {
    if (!ready || !account.email || fingerprint(data) === syncedPrint.current) return;
    const id = setTimeout(() => syncNow(), 4000);
    return () => clearTimeout(id);
  }, [data, ready, account.email, syncNow]);

  const sendCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
    return !error;
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    return !error;
  }, []);

  const signInGoogle = useCallback(async (): Promise<'ok' | 'cancel' | 'error'> => {
    try {
      const token = await googleIdToken();
      if (!token) return 'cancel';
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token });
      return error ? 'error' : 'ok';
    } catch {
      return 'error';
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    googleSignOut();
    syncedPrint.current = null;
    AsyncStorage.removeItem(LAST_SYNC_KEY).catch(() => {});
    setAccount({ email: null, syncing: false, lastSync: null, error: false });
  }, []);

  /** Deletes the account and its backup on the server. Data on this phone stays. */
  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) return false;
    await signOut();
    return true;
  }, [signOut]);

  const resetAll = useCallback(() => {
    // signed in: sign out first, otherwise the next backup would bring the data back
    signOut();
    setData(EMPTY);
    Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  }, [signOut]);

  const value = useMemo<Store>(
    () => ({ ...data, ready, lang, t, updateSettings, addPlan, removePlan, startProgram, stopProgram, addLog, deleteLog, resetAll, account, sendCode, verifyCode, signInGoogle, syncNow, signOut, deleteAccount }),
    [data, ready, lang, t, updateSettings, addPlan, removePlan, startProgram, stopProgram, addLog, deleteLog, resetAll, account, sendCode, verifyCode, signInGoogle, syncNow, signOut, deleteAccount],
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
