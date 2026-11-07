import type { LogEntry, PlanEntry, Settings } from './types';

export interface ActiveProgram {
  id: string;
  start: string; // Monday of week 1
}

/** Everything the app stores. The same shape is kept in the optional cloud backup. */
export interface Data {
  settings: Settings;
  plan: PlanEntry[];
  log: LogEntry[];
  program: ActiveProgram | null;
  /** ids of deleted plan / log entries → deletion time (ms), so a merge does not bring them back */
  deleted?: Record<string, number>;
  /** last local change of settings / program (ms) – newer side wins on merge */
  settingsAt?: number;
  programAt?: number;
}

const TOMBSTONE_DAYS = 180;

function unionById<T extends { id: string }>(a: T[], b: T[], deleted: Record<string, number>): T[] {
  const map = new Map<string, T>();
  for (const x of [...b, ...a]) if (!deleted[x.id]) map.set(x.id, x);
  return [...map.values()];
}

/** Merge two copies of the data (this phone + backup). Never loses a logged workout. */
export function merge(local: Data, remote: Partial<Data> | null | undefined): Data {
  if (!remote) return local;
  const cutoff = Date.now() - TOMBSTONE_DAYS * 864e5;
  const deleted: Record<string, number> = {};
  for (const src of [remote.deleted ?? {}, local.deleted ?? {}]) {
    for (const [id, at] of Object.entries(src)) if (at > cutoff) deleted[id] = Math.max(deleted[id] ?? 0, at);
  }
  const remoteSettingsNewer = (remote.settingsAt ?? 0) > (local.settingsAt ?? 0) && !!remote.settings;
  const remoteProgramNewer = (remote.programAt ?? 0) > (local.programAt ?? 0);
  const log = unionById(local.log, remote.log ?? [], deleted).sort((x, y) =>
    x.date === y.date ? (y.finishedAt ?? '').localeCompare(x.finishedAt ?? '') : y.date.localeCompare(x.date),
  );
  const plan = unionById(local.plan, remote.plan ?? [], deleted).sort((x, y) => x.date.localeCompare(y.date));
  return {
    settings: remoteSettingsNewer ? { ...local.settings, ...remote.settings, reminder: { ...local.settings.reminder, ...remote.settings!.reminder } } : local.settings,
    settingsAt: Math.max(local.settingsAt ?? 0, remote.settingsAt ?? 0) || undefined,
    program: remoteProgramNewer ? (remote.program ?? null) : local.program,
    programAt: Math.max(local.programAt ?? 0, remote.programAt ?? 0) || undefined,
    plan,
    log,
    deleted,
  };
}

/** Stable string for "did anything change since the last backup?" */
export const fingerprint = (d: Data) => JSON.stringify([d.settings, d.plan, d.log, d.program, d.deleted ?? {}]);
