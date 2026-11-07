/**
 * Tiny 2-D skeleton for exercise pictogram animations.
 *
 * Side view, the figure faces right. Every segment angle is ABSOLUTE in degrees:
 *   0 = pointing down, 90 = forward (right), 180 = up, -90 = backward (left).
 * The torso angle points from hip to shoulder (180 = upright).
 */

export type Pair = [upper: number, lower: number];

export interface Pose {
  t?: number; // torso
  bend?: number; // spine curve, + = round back (cat), - = arched (cow)
  aN?: Pair; // near arm [upper arm, forearm]
  aF?: Pair; // far arm
  lN?: Pair; // near leg [thigh, shin]
  lF?: Pair; // far leg
  fN?: number; // near foot angle (default: shin + 90)
  fF?: number;
  dx?: number; // extra offset after anchoring (jumps)
  dy?: number;
}

export type Equip = 'kb1' | 'kb2' | 'db1' | 'db2' | 'bb' | 'bbBack' | 'bbHip' | 'farmers' | 'log' | 'stone' | 'sandbag';

export type Prop =
  | { kind: 'bar' } // pull-up bar at frame-0 hand height
  | { kind: 'lowbar' }
  | { kind: 'dipbar' }
  | { kind: 'bench' } // under the lying body in frame 0
  | { kind: 'benchShoulder' }
  | { kind: 'seat' }
  | { kind: 'platform' } // leg-press sled, follows the feet
  | { kind: 'cable'; dx: number; dy: number } // pulley fixed relative to frame-0 hand
  | { kind: 'rope' }
  | { kind: 'bike' }
  | { kind: 'rower' }
  | { kind: 'step' }
  | { kind: 'sled' } // pushed in front of the hands, the ground moves
  | { kind: 'box' } // plyo box in front of the frame-0 toes
  | { kind: 'rings' }; // straps from above to the hands

export type Anchor = 'ankle' | 'hand' | 'hip' | 'shoulder' | 'lowest';

export interface Anim {
  /** [pose, ms to next pose, optional hold ms] – loops back to the first pose */
  frames: [Pose, number, number?][];
  anchor: Anchor;
  equip?: Equip;
  props?: Prop[];
  /** scrolling ground for running / walking */
  moving?: boolean;
}

export type Pt = { x: number; y: number };

export interface Body {
  hip: Pt;
  shoulder: Pt;
  head: Pt;
  spineCtrl: Pt;
  elbowN: Pt;
  handN: Pt;
  elbowF: Pt;
  handF: Pt;
  kneeN: Pt;
  ankleN: Pt;
  toeN: Pt;
  kneeF: Pt;
  ankleF: Pt;
  toeF: Pt;
}

export const LEN = { torso: 48, ua: 26, fa: 25, th: 35, sh: 35, foot: 10, headR: 9, neck: 4 };
export const VIEW = 200;
export const GROUND = 188;

const rad = (a: number) => (a * Math.PI) / 180;
const dir = (a: number, l: number): Pt => ({ x: Math.sin(rad(a)) * l, y: Math.cos(rad(a)) * l });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });

const DEF: Required<Omit<Pose, 'fN' | 'fF' | 'dx' | 'dy' | 'bend'>> = { t: 180, aN: [0, 0], aF: [0, 0], lN: [0, 0], lF: [0, 0] };

/** Forward kinematics with the hip at (0,0). */
export function solve(p: Pose): Body {
  const t = p.t ?? DEF.t;
  const aN = p.aN ?? DEF.aN;
  const aF = p.aF ?? DEF.aF;
  const lN = p.lN ?? DEF.lN;
  const lF = p.lF ?? DEF.lF;
  const hip = { x: 0, y: 0 };
  const shoulder = dir(t, LEN.torso);
  const head = add(shoulder, dir(t, LEN.neck + LEN.headR));
  const d = dir(t, 1);
  const mid = { x: shoulder.x / 2, y: shoulder.y / 2 };
  const bend = p.bend ?? 0;
  const spineCtrl = { x: mid.x + d.y * bend, y: mid.y - d.x * bend };
  const elbowN = add(shoulder, dir(aN[0], LEN.ua));
  const handN = add(elbowN, dir(aN[1], LEN.fa));
  const elbowF = add(shoulder, dir(aF[0], LEN.ua));
  const handF = add(elbowF, dir(aF[1], LEN.fa));
  const kneeN = dir(lN[0], LEN.th);
  const ankleN = add(kneeN, dir(lN[1], LEN.sh));
  const toeN = add(ankleN, dir(p.fN ?? lN[1] + 90, LEN.foot));
  const kneeF = dir(lF[0], LEN.th);
  const ankleF = add(kneeF, dir(lF[1], LEN.sh));
  const toeF = add(ankleF, dir(p.fF ?? lF[1] + 90, LEN.foot));
  return { hip, shoulder, head, spineCtrl, elbowN, handN, elbowF, handF, kneeN, ankleN, toeN, kneeF, ankleF, toeF };
}

export function translate(b: Body, dx: number, dy: number): Body {
  const out = {} as Body;
  for (const k of Object.keys(b) as (keyof Body)[]) out[k] = { x: b[k].x + dx, y: b[k].y + dy };
  return out;
}

const BODY_KEYS: (keyof Body)[] = ['hip', 'shoulder', 'elbowN', 'handN', 'elbowF', 'handF', 'kneeN', 'ankleN', 'toeN', 'kneeF', 'ankleF', 'toeF'];

function lowestY(b: Body) {
  let m = b.head.y + LEN.headR;
  for (const k of BODY_KEYS) m = Math.max(m, b[k].y);
  return m;
}

const anchorPoint = (b: Body, a: Anchor): Pt | null =>
  a === 'ankle' ? b.ankleN : a === 'hand' ? b.handN : a === 'hip' ? b.hip : a === 'shoulder' ? b.shoulder : null;

/** World placement of frame 0: centred horizontally, standing on the ground (or hanging from a bar). */
export function placeFirst(anim: Anim): { dx: number; dy: number } {
  const b = solve(anim.frames[0][0]);
  let minX = Infinity;
  let maxX = -Infinity;
  for (const k of [...BODY_KEYS, 'head' as const]) {
    minX = Math.min(minX, b[k].x);
    maxX = Math.max(maxX, b[k].x);
  }
  const dx = VIEW / 2 - (minX + maxX) / 2;
  const hanging = anim.props?.some((p) => p.kind === 'bar');
  const dy = hanging ? 22 - b.handN.y : GROUND - 5 - lowestY(b);
  return { dx, dy };
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpPair = (a: Pair, b: Pair, k: number): Pair => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

export function mixPose(a: Pose, b: Pose, k: number): Pose {
  const g = <K extends keyof typeof DEF>(p: Pose, key: K) => (p[key] ?? DEF[key]) as (typeof DEF)[K];
  const aN = g(a, 'lN');
  const bN = g(b, 'lN');
  const aF = g(a, 'lF');
  const bF = g(b, 'lF');
  return {
    t: lerp(g(a, 't'), g(b, 't'), k),
    bend: lerp(a.bend ?? 0, b.bend ?? 0, k),
    aN: lerpPair(g(a, 'aN'), g(b, 'aN'), k),
    aF: lerpPair(g(a, 'aF'), g(b, 'aF'), k),
    lN: lerpPair(aN, bN, k),
    lF: lerpPair(aF, bF, k),
    fN: lerp(a.fN ?? aN[1] + 90, b.fN ?? bN[1] + 90, k),
    fF: lerp(a.fF ?? aF[1] + 90, b.fF ?? bF[1] + 90, k),
    dx: lerp(a.dx ?? 0, b.dx ?? 0, k),
    dy: lerp(a.dy ?? 0, b.dy ?? 0, k),
  };
}

export function cycleLength(anim: Anim) {
  return anim.frames.reduce((s, f) => s + f[1] + (f[2] ?? 0), 0);
}

/** Pose at time ms (looping), eased. */
export function poseAt(anim: Anim, ms: number): Pose {
  const total = cycleLength(anim);
  let t = ((ms % total) + total) % total;
  const n = anim.frames.length;
  for (let i = 0; i < n; i++) {
    const [p, dur, hold = 0] = anim.frames[i];
    if (t < hold) return p;
    t -= hold;
    if (t < dur) {
      const k = t / dur;
      const eased = k * k * (3 - 2 * k);
      return mixPose(p, anim.frames[(i + 1) % n][0], eased);
    }
    t -= dur;
  }
  return anim.frames[0][0];
}

/** Body in world coordinates for a pose of this animation. */
export function place(anim: Anim, pose: Pose, first: { dx: number; dy: number }, firstBody: Body): Body {
  const b = solve(pose);
  let dx = first.dx;
  let dy = first.dy;
  if (anim.anchor === 'lowest') {
    dy = GROUND - 5 - lowestY(b);
  } else {
    const ap = anchorPoint(b, anim.anchor)!;
    const target = anchorPoint(firstBody, anim.anchor)!;
    dx = target.x - ap.x;
    dy = target.y - ap.y;
  }
  return translate(b, dx + (pose.dx ?? 0), dy + (pose.dy ?? 0));
}
