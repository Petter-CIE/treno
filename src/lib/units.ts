export type UnitSystem = 'metric' | 'imperial';

/** Common kettlebell sizes in kg */
export const STANDARD_BELLS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48];

const LB = 2.20462;
const MI = 0.621371;

export const weightUnit = (u: UnitSystem) => (u === 'imperial' ? 'lb' : 'kg');
export const distUnit = (u: UnitSystem) => (u === 'imperial' ? 'mi' : 'km');

export function fmtWeight(kg: number, u: UnitSystem): string {
  if (u === 'imperial') return `${Math.round(kg * LB)} lb`;
  return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
}

/** user input in display unit → kg */
export const toKg = (v: number, u: UnitSystem) => (u === 'imperial' ? v / LB : v);
export const fromKg = (kg: number, u: UnitSystem) => (u === 'imperial' ? kg * LB : kg);

export const toKm = (v: number, u: UnitSystem) => (u === 'imperial' ? v / MI : v);
export const fromKm = (km: number, u: UnitSystem) => (u === 'imperial' ? km * MI : km);

export function fmtDistance(km: number, u: UnitSystem): string {
  const v = fromKm(km, u);
  return `${v.toFixed(v < 10 ? 2 : 1)} ${distUnit(u)}`;
}

export function fmtPace(sec: number, km: number, u: UnitSystem): string {
  const d = fromKm(km, u);
  if (!d) return '–';
  const p = sec / d;
  const m = Math.floor(p / 60);
  const s = Math.round(p % 60);
  return `${m}:${`${s}`.padStart(2, '0')} /${distUnit(u)}`;
}

export function fmtVolume(kg: number, u: UnitSystem): string {
  const v = fromKg(kg, u);
  if (v >= 10000) return u === 'imperial' ? `${(v / 1000).toFixed(1)}k lb` : `${(v / 1000).toFixed(1)} t`;
  return `${Math.round(v)} ${weightUnit(u)}`;
}
