/**
 * Turns a posed skeleton into a fixed list of SVG path layers.
 *
 * Every frame of an animation produces the same layers in the same order, each a single path
 * string, so a whole loop can be precomputed once and played on the UI thread by only swapping
 * `d` attributes (see components/ExerciseAnimation.tsx).
 */
import { ANIMATIONS } from '@/data/animations';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { C } from './theme';
import { GROUND, LEN, VIEW, cycleLength, place, placeFirst, poseAt, solve, translate, type Anim, type Body, type Pose, type Pt } from './figure';
import type { Muscle } from './types';

export const MUSCLE = '#F29A5E';
const MUSCLE_FAR = '#9C6446';

export type LayerId =
  | 'shadow' | 'ground' | 'backFill' | 'backStroke'
  | 'farThigh' | 'farShin' | 'farUpper' | 'farFore' | 'farEq'
  | 'torso' | 'head'
  | 'nearThigh' | 'nearShin' | 'nearUpper' | 'nearFore'
  | 'eqFill' | 'eqInner' | 'eqTop' | 'eqStroke'
  | 'frontFill' | 'frontFine' | 'rope' | 'arrow';

export const LAYER_IDS: LayerId[] = [
  'shadow', 'ground', 'backFill', 'backStroke',
  'farThigh', 'farShin', 'farUpper', 'farFore', 'farEq',
  'torso', 'head',
  'nearThigh', 'nearShin', 'nearUpper', 'nearFore',
  'eqFill', 'eqInner', 'eqTop', 'eqStroke',
  'frontFill', 'frontFine', 'rope', 'arrow',
];

export interface LayerStyle {
  fill?: string;
  stroke?: string;
  sw?: number;
  op?: number;
}

const EMPTY = 'M0 0';
const f1 = (n: number) => Math.round(n * 10) / 10;

// ── primitive shapes as path strings ──────────────────────────────────

const circle = (c: Pt, r: number) => `M${f1(c.x - r)} ${f1(c.y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;

const rect = (x: number, y: number, w: number, h: number, r = 0) => {
  r = Math.min(r, w / 2, h / 2);
  if (!r) return `M${f1(x)} ${f1(y)}h${f1(w)}v${f1(h)}h${f1(-w)}Z`;
  return `M${f1(x + r)} ${f1(y)}h${f1(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${f1(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${f1(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${f1(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
};

const ellipse = (c: Pt, rx: number, ry: number) =>
  `M${f1(c.x - rx)} ${f1(c.y)}a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0Z`;

/** A tube through points with a radius at each point and round caps – limbs, torso, bars. */
function tube(pts: Pt[], rs: number[]) {
  const n = pts.length;
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    L.push({ x: pts[i].x - dy * rs[i], y: pts[i].y + dx * rs[i] });
    R.push({ x: pts[i].x + dy * rs[i], y: pts[i].y - dx * rs[i] });
  }
  const re = rs[n - 1];
  const r0 = rs[0];
  let d = `M${f1(L[0].x)} ${f1(L[0].y)}`;
  for (let i = 1; i < n; i++) d += `L${f1(L[i].x)} ${f1(L[i].y)}`;
  d += `A${f1(re)} ${f1(re)} 0 0 0 ${f1(R[n - 1].x)} ${f1(R[n - 1].y)}`;
  for (let i = n - 2; i >= 0; i--) d += `L${f1(R[i].x)} ${f1(R[i].y)}`;
  d += `A${f1(r0)} ${f1(r0)} 0 0 0 ${f1(L[0].x)} ${f1(L[0].y)}Z`;
  return d;
}

const bar = (a: Pt, b: Pt, w: number) => tube([a, b], [w / 2, w / 2]);
const line = (a: Pt, b: Pt) => `M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}`;

function quadPts(a: Pt, c: Pt, b: Pt, steps = 6) {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const u = 1 - k;
    out.push({ x: u * u * a.x + 2 * u * k * c.x + k * k * b.x, y: u * u * a.y + 2 * u * k * c.y + k * k * b.y });
  }
  return out;
}

// ── body ──────────────────────────────────────────────────────────────

const R = { hip: 6.6, chest: 8.6, knee: 5, ankle: 3.4, toe: 2.6, shoulder: 4.6, elbow: 3.7, wrist: 2.9 };

type Seg = 'thigh' | 'shin' | 'upper' | 'fore' | 'torso';

/** Which body parts glow for a muscle group. */
const HIGHLIGHT: Record<Muscle, Seg[]> = {
  legs: ['thigh', 'shin'],
  chest: ['torso', 'upper'],
  back: ['torso'],
  shoulders: ['upper'],
  arms: ['upper', 'fore'],
  core: ['torso'],
  fullbody: ['torso', 'thigh'],
  cardio: ['thigh', 'shin'],
};

// ── equipment (held) ──────────────────────────────────────────────────

interface Out {
  [k: string]: string[];
}
const push = (o: Out, k: LayerId, d: string) => (o[k] ??= []).push(d);

function dumbbell(o: Out, k: LayerId, p: Pt) {
  push(o, k, rect(p.x - 9, p.y - 2, 18, 4, 2));
  push(o, k, circle({ x: p.x - 8, y: p.y }, 5));
  push(o, k, circle({ x: p.x + 8, y: p.y }, 5));
}

function farmer(o: Out, k: LayerId, p: Pt) {
  push(o, k, rect(p.x - 16, p.y - 2, 32, 4, 2));
  push(o, k, rect(p.x - 19, p.y - 11, 6, 22, 2));
  push(o, k, rect(p.x + 13, p.y - 11, 6, 22, 2));
}

function plate(o: Out, p: Pt) {
  push(o, 'eqFill', circle(p, 16));
  push(o, 'eqInner', circle(p, 12));
  push(o, 'eqTop', circle(p, 3));
}

function equipment(o: Out, anim: Anim, b: Body) {
  switch (anim.equip) {
    case 'kb1':
    case 'kb2': {
      const up = b.handN.y < b.elbowN.y - 4;
      const c = up ? { x: b.handN.x - 7, y: b.handN.y + 5 } : { x: b.handN.x, y: b.handN.y + 12 };
      push(o, 'eqStroke', line(b.handN, c));
      push(o, 'eqFill', circle(c, 8.5));
      push(o, 'eqInner', circle({ x: c.x - 2.5, y: c.y - 2.5 }, 2.2));
      break;
    }
    case 'db1':
    case 'db2':
      dumbbell(o, 'eqFill', b.handN);
      if (anim.equip === 'db2') dumbbell(o, 'farEq', b.handF);
      break;
    case 'farmers':
      farmer(o, 'eqFill', b.handN);
      farmer(o, 'farEq', b.handF);
      break;
    case 'bb':
      plate(o, b.handN);
      break;
    case 'bbBack':
      plate(o, { x: b.shoulder.x - 6, y: b.shoulder.y - 2 });
      break;
    case 'bbHip':
      plate(o, { x: b.hip.x + 4, y: b.hip.y - 14 });
      break;
    case 'log':
      push(o, 'eqFill', rect(b.handN.x - 13, b.handN.y - 9, 26, 18, 9));
      push(o, 'eqInner', circle({ x: b.handN.x + 7, y: b.handN.y }, 5));
      break;
    case 'stone': {
      const c = { x: (b.handN.x + b.handF.x) / 2 + 9, y: (b.handN.y + b.handF.y) / 2 - 4 };
      push(o, 'eqFill', circle(c, 15));
      push(o, 'eqInner', circle(c, 11));
      break;
    }
    case 'sandbag': {
      const c = { x: b.handN.x + 6, y: b.handN.y - 6 };
      push(o, 'eqFill', rect(c.x - 15, c.y - 10, 30, 20, 8));
      break;
    }
  }
}

// ── props (environment) ───────────────────────────────────────────────

function props(o: Out, anim: Anim, b: Body, f: Body, ms: number) {
  for (const p of anim.props ?? []) {
    switch (p.kind) {
      case 'bar':
        push(o, 'frontFill', bar({ x: f.handN.x - 38, y: f.handN.y }, { x: f.handN.x + 38, y: f.handN.y }, 5));
        break;
      case 'lowbar':
      case 'dipbar': {
        const y = f.handN.y + 1;
        const x0 = p.kind === 'lowbar' ? f.handN.x - 30 : f.handN.x - 22;
        const x1 = p.kind === 'lowbar' ? f.handN.x + 30 : f.handN.x + 14;
        push(o, 'backFill', bar({ x: x0, y }, { x: x1, y }, 5));
        push(o, 'backFill', rect(x0 + 2, y, 4, GROUND - y));
        push(o, 'backFill', rect(x1 - 6, y, 4, GROUND - y));
        break;
      }
      case 'bench': {
        const top = Math.max(f.hip.y, f.shoulder.y) + 8;
        const x0 = Math.min(f.hip.x, f.shoulder.x) - 14;
        const x1 = Math.max(f.hip.x, f.shoulder.x) + 8;
        push(o, 'backFill', rect(x0, top, x1 - x0, 7, 3));
        push(o, 'backFill', rect(x0 + 8, top, 4, GROUND - top));
        push(o, 'backFill', rect(x1 - 12, top, 4, GROUND - top));
        break;
      }
      case 'benchShoulder': {
        const top = f.shoulder.y + 8;
        push(o, 'backFill', rect(f.shoulder.x - 34, top, 34, GROUND - top, 4));
        break;
      }
      case 'seat': {
        const top = f.hip.y + 8;
        push(o, 'backFill', rect(f.hip.x - 20, top, 34, 7, 3));
        push(o, 'backFill', rect(f.hip.x - 5.5, top, 5, GROUND - top));
        break;
      }
      case 'platform': {
        const dx = b.ankleN.x - b.hip.x;
        const dy = b.ankleN.y - b.hip.y;
        const l = Math.hypot(dx, dy) || 1;
        const ux = dx / l;
        const uy = dy / l;
        const c = { x: b.ankleN.x + ux * 7, y: b.ankleN.y + uy * 7 };
        push(o, 'frontFill', bar({ x: c.x - uy * 18, y: c.y + ux * 18 }, { x: c.x + uy * 18, y: c.y - ux * 18 }, 6));
        break;
      }
      case 'cable': {
        const a = { x: f.handN.x + p.dx, y: f.handN.y + p.dy };
        push(o, 'frontFine', line(b.handN, a));
        push(o, 'frontFill', circle(a, 5));
        push(o, 'eqFill', rect(b.handN.x - 7, b.handN.y - 2, 14, 4, 2));
        break;
      }
      case 'rope': {
        const th = (ms / 440) * Math.PI * 2;
        const cx = b.hip.x + 2;
        const cy = (b.handN.y + b.toeN.y) / 2 - 18;
        const ry = b.toeN.y - cy + 6;
        const P = { x: cx + 22 * Math.sin(th), y: cy + ry * Math.cos(th) };
        push(o, 'rope', `M${f1(b.handN.x)} ${f1(b.handN.y)}Q${f1(cx + 40 * Math.sin(th))} ${f1((b.handN.y + P.y) / 2)} ${f1(P.x)} ${f1(P.y)}`);
        break;
      }
      case 'bike': {
        const h = f.hip;
        const wy = h.y + 52;
        push(o, 'backStroke', `${circle({ x: h.x - 22, y: wy }, 17)}${circle({ x: h.x + 62, y: wy }, 17)}`);
        push(o, 'backStroke', `M${h.x - 22} ${wy}L${h.x + 6} ${h.y + 48}L${h.x} ${h.y + 6}M${h.x + 6} ${h.y + 48}L${h.x + 56} ${h.y + 4}L${h.x + 62} ${wy}M${h.x} ${h.y + 6}L${h.x + 56} ${h.y + 4}`);
        push(o, 'backFill', rect(h.x - 12, h.y + 4, 22, 6, 3));
        push(o, 'backFill', circle({ x: h.x + 6, y: h.y + 48 }, 6));
        break;
      }
      case 'rower': {
        const railY = GROUND - 8;
        const fly = { x: f.toeN.x + 26, y: GROUND - 24 };
        push(o, 'backFill', bar({ x: f.hip.x - 50, y: railY }, { x: fly.x, y: railY }, 4));
        push(o, 'backFill', circle(fly, 14));
        push(o, 'backFill', rect(b.hip.x - 14, b.hip.y + 6, 26, 6, 3));
        push(o, 'frontFine', line(b.handN, fly));
        break;
      }
      case 'step': {
        const h = Math.max(4, f.toeF.y - f.toeN.y);
        push(o, 'backFill', rect(f.ankleN.x - 16, GROUND - h, 44, h, 3));
        break;
      }
      case 'sled': {
        const x = b.handN.x + 4;
        push(o, 'frontFill', bar({ x, y: b.handN.y }, { x, y: GROUND - 4 }, 5));
        push(o, 'frontFill', rect(x, GROUND - 26, 30, 22, 3));
        push(o, 'frontFill', bar({ x: x - 4, y: GROUND - 2 }, { x: x + 38, y: GROUND - 2 }, 4));
        break;
      }
      case 'box':
        push(o, 'backFill', rect(f.toeN.x + 12, GROUND - 34, 46, 34, 4));
        break;
      case 'rings':
        push(o, 'frontFine', line({ x: f.handN.x, y: 8 }, { x: b.handN.x, y: b.handN.y - 6 }));
        push(o, 'eqStroke', circle(b.handN, 6));
        break;
    }
  }
}

// ── one frame ─────────────────────────────────────────────────────────

export interface Setup {
  first: { dx: number; dy: number };
  firstBody: Body;
}

export function setupFor(anim: Anim): Setup {
  const first = placeFirst(anim);
  return { first, firstBody: translate(solve(anim.frames[0][0]), first.dx, first.dy) };
}

function groundPath(anim: Anim, ms: number, cycle: number) {
  if (!anim.moving) return bar({ x: 14, y: GROUND }, { x: VIEW - 14, y: GROUND }, 2);
  // dashes scroll at a speed that makes the loop seamless
  const period = 24;
  const speed = (period * Math.max(1, Math.round(cycle / 6 / period))) / cycle;
  const off = (ms * speed) % period;
  let d = '';
  for (let x = 4 - period + off; x < VIEW - 4; x += period) {
    const a = Math.max(4, x);
    const b = Math.min(VIEW - 4, x + 14);
    if (b > a) d += bar({ x: a, y: GROUND }, { x: b, y: GROUND }, 2);
  }
  return d || EMPTY;
}

function shadowPath(b: Body) {
  const feet = [b.toeN, b.toeF, b.ankleN, b.ankleF, b.handN, b.handF, b.kneeN, b.kneeF, b.hip];
  const low = Math.max(...feet.map((p) => p.y), b.head.y + LEN.headR);
  const lift = Math.max(0, GROUND - 5 - low);
  const near = feet.filter((p) => p.y > low - 14);
  const xs = near.map((p) => p.x);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const spread = Math.max(...xs) - Math.min(...xs);
  const k = Math.max(0.35, 1 - lift / 70);
  return ellipse({ x: cx, y: GROUND + 1 }, (spread / 2 + 14) * k, 3.2 * k);
}

/** Vertical movement of the hip between two moments: + down, − up. */
function hipVy(anim: Anim, setup: Setup, ms: number) {
  const a = place(anim, poseAt(anim, ms - 40), setup.first, setup.firstBody);
  const b = place(anim, poseAt(anim, ms + 40), setup.first, setup.firstBody);
  const mid = (p: Body) => (p.hip.y + p.shoulder.y) / 2;
  return (mid(b) - mid(a)) / 80;
}

function arrowPath(vy: number) {
  if (Math.abs(vy) < 0.03) return EMPTY;
  const x = VIEW - 16;
  const down = vy > 0;
  const y0 = down ? 74 : 126;
  const y1 = down ? 120 : 80;
  const tip = down ? 130 : 70;
  return `${bar({ x, y: y0 }, { x, y: y1 }, 4)}M${x - 8} ${y1}L${x + 8} ${y1}L${x} ${tip}Z`;
}

export function buildFrame(anim: Anim, setup: Setup, pose: Pose, ms: number, opts: { arrows?: boolean; cycle: number }): Record<LayerId, string> {
  const b = place(anim, pose, setup.first, setup.firstBody);
  const o: Out = {};
  push(o, 'shadow', shadowPath(b));
  push(o, 'ground', groundPath(anim, ms, opts.cycle));
  props(o, anim, b, setup.firstBody, ms);
  // far side
  push(o, 'farThigh', tube([b.hip, b.kneeF], [R.hip - 0.6, R.knee]));
  push(o, 'farShin', tube([b.kneeF, b.ankleF], [R.knee - 0.3, R.ankle]) + tube([b.ankleF, b.toeF], [R.ankle - 0.4, R.toe]));
  push(o, 'farUpper', tube([b.shoulder, b.elbowF], [R.shoulder, R.elbow]));
  push(o, 'farFore', tube([b.elbowF, b.handF], [R.elbow - 0.2, R.wrist]));
  // torso along the spine curve, wider at the chest
  const spine = quadPts(b.hip, b.spineCtrl, b.shoulder);
  push(o, 'torso', tube(spine, spine.map((_, i) => R.hip + (R.chest - R.hip) * Math.sin((i / (spine.length - 1)) * Math.PI * 0.62))));
  push(o, 'head', circle(b.head, LEN.headR + 0.6));
  // near side
  push(o, 'nearThigh', tube([b.hip, b.kneeN], [R.hip, R.knee]));
  push(o, 'nearShin', tube([b.kneeN, b.ankleN], [R.knee, R.ankle]) + tube([b.ankleN, b.toeN], [R.ankle, R.toe]));
  push(o, 'nearUpper', tube([b.shoulder, b.elbowN], [R.shoulder + 0.4, R.elbow]));
  push(o, 'nearFore', tube([b.elbowN, b.handN], [R.elbow, R.wrist]));
  equipment(o, anim, b);
  if (opts.arrows && !anim.moving) push(o, 'arrow', arrowPath(hipVy(anim, setup, ms)));
  const out = {} as Record<LayerId, string>;
  for (const id of LAYER_IDS) out[id] = o[id]?.join('') || EMPTY;
  return out;
}

// ── styles per exercise ───────────────────────────────────────────────

export function layerStyles(exId: string, color?: string): Record<LayerId, LayerStyle> {
  const near = color ?? C.text;
  const far = C.figureFar;
  const muscle = EXERCISE_BY_ID[exId]?.muscle;
  const hi = new Set(muscle ? HIGHLIGHT[muscle] : []);
  const n = (s: Seg) => (hi.has(s) && !color ? MUSCLE : near);
  const fa = (s: Seg) => (hi.has(s) && !color ? MUSCLE_FAR : far);
  return {
    shadow: { fill: '#000000', op: 0.32 },
    ground: { fill: C.prop },
    backFill: { fill: C.prop },
    backStroke: { stroke: C.prop, sw: 4 },
    farThigh: { fill: fa('thigh') },
    farShin: { fill: fa('shin') },
    farUpper: { fill: fa('upper') },
    farFore: { fill: fa('fore') },
    farEq: { fill: C.accent, op: 0.55 },
    torso: { fill: n('torso') },
    head: { fill: near },
    nearThigh: { fill: n('thigh') },
    nearShin: { fill: n('shin') },
    nearUpper: { fill: n('upper') },
    nearFore: { fill: n('fore') },
    eqFill: { fill: C.accent },
    eqInner: { fill: C.accentDim },
    eqTop: { fill: C.accent },
    eqStroke: { stroke: C.accent, sw: 3 },
    frontFill: { fill: C.prop },
    frontFine: { stroke: C.prop, sw: 2 },
    rope: { stroke: C.accent, sw: 2.5 },
    arrow: { fill: C.muted, op: 0.7 },
  };
}

// ── precomputed loops ─────────────────────────────────────────────────

export const FPS = 30;

export interface Loop {
  cycle: number;
  frames: number;
  /** layer → path per frame */
  paths: Record<LayerId, string[]>;
}

const loops = new Map<string, Loop>();

export function loopFor(exId: string, arrows: boolean): Loop | null {
  const key = `${exId}:${arrows ? 1 : 0}`;
  const hit = loops.get(key);
  if (hit) return hit;
  const anim = ANIMATIONS[exId];
  if (!anim) return null;
  const setup = setupFor(anim);
  const cycle = cycleLength(anim);
  const frames = Math.max(2, Math.round((cycle / 1000) * FPS));
  const paths = {} as Record<LayerId, string[]>;
  for (const id of LAYER_IDS) paths[id] = new Array(frames);
  for (let i = 0; i < frames; i++) {
    const ms = (i / frames) * cycle;
    const f = buildFrame(anim, setup, poseAt(anim, ms), ms, { arrows, cycle });
    for (const id of LAYER_IDS) paths[id][i] = f[id];
  }
  const loop = { cycle, frames, paths };
  loops.set(key, loop);
  return loop;
}

/** A single still frame (key pose `frame`), for thumbnails and paused states. */
export function stillFor(exId: string, frame = 0): Record<LayerId, string> | null {
  const anim = ANIMATIONS[exId];
  if (!anim) return null;
  const setup = setupFor(anim);
  const pose = anim.frames[Math.min(frame, anim.frames.length - 1)][0];
  return buildFrame(anim, setup, pose, 0, { cycle: cycleLength(anim) });
}

/** Seconds spent moving down and up in one repetition – shown as tempo under the animation. */
export function tempoFor(exId: string): { down: number; up: number } | null {
  const anim = ANIMATIONS[exId];
  if (!anim || anim.moving) return null;
  const setup = setupFor(anim);
  const mid = (p: Pose) => {
    const bd = place(anim, p, setup.first, setup.firstBody);
    return (bd.hip.y + bd.shoulder.y) / 2;
  };
  let down = 0;
  let up = 0;
  const n = anim.frames.length;
  for (let i = 0; i < n; i++) {
    const dy = mid(anim.frames[(i + 1) % n][0]) - mid(anim.frames[i][0]);
    if (dy > 3) down += anim.frames[i][1];
    else if (dy < -3) up += anim.frames[i][1];
  }
  if (down < 250 || up < 250) return null;
  const r = (x: number) => Math.round(x / 100) / 10;
  return { down: r(down), up: r(up) };
}
