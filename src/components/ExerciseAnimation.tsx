import { memo, useEffect, useMemo, useState } from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { ANIMATIONS } from '@/data/animations';
import { GROUND, LEN, VIEW, cycleLength, place, placeFirst, poseAt, solve, translate, type Anim, type Body, type Pt } from '@/lib/figure';
import { C } from '@/lib/theme';

const NEAR = C.text;
const FAR = C.figureFar;
const PROP = C.prop;
const EQ = C.accent;
const LIMB = 9;

export function hasAnimation(id: string) {
  return !!ANIMATIONS[id];
}

/** Looping pictogram of an exercise. `playing={false}` renders the first pose only. */
export const ExerciseAnimation = memo(function ExerciseAnimation({
  id,
  size = 200,
  playing = true,
  color,
  dim,
  frame = 0,
}: {
  id: string;
  size?: number;
  playing?: boolean;
  color?: string;
  dim?: boolean;
  /** which key pose to show when not playing */
  frame?: number;
}) {
  const anim = ANIMATIONS[id];
  const ms = useClock(playing && !!anim);
  const setup = useMemo(() => {
    if (!anim) return null;
    const first = placeFirst(anim);
    const firstBody = translate(solve(anim.frames[0][0]), first.dx, first.dy);
    return { first, firstBody };
  }, [anim]);
  if (!anim || !setup) return null;

  const pose = playing ? poseAt(anim, ms) : anim.frames[Math.min(frame, anim.frames.length - 1)][0];
  const body = place(anim, pose, setup.first, setup.firstBody);
  const near = color ?? NEAR;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`} opacity={dim ? 0.45 : 1}>
      <Ground moving={!!anim.moving && playing} ms={ms} />
      <Props anim={anim} b={body} f={setup.firstBody} ms={ms} back />
      {/* far side */}
      <Limb a={body.hip} b={body.kneeF} c={body.ankleF} d={body.toeF} color={FAR} />
      <Limb a={body.shoulder} b={body.elbowF} c={body.handF} color={FAR} />
      {anim.equip === 'db2' ? <Dumbbell p={body.handF} far /> : null}
      {/* torso + head */}
      <Path d={`M${body.hip.x} ${body.hip.y} Q${body.spineCtrl.x} ${body.spineCtrl.y} ${body.shoulder.x} ${body.shoulder.y}`} stroke={near} strokeWidth={LIMB + 3} strokeLinecap="round" fill="none" />
      <Circle cx={body.head.x} cy={body.head.y} r={LEN.headR} fill={near} />
      {/* near side */}
      <Limb a={body.hip} b={body.kneeN} c={body.ankleN} d={body.toeN} color={near} />
      <Limb a={body.shoulder} b={body.elbowN} c={body.handN} color={near} />
      <Equipment anim={anim} b={body} />
      <Props anim={anim} b={body} f={setup.firstBody} ms={ms} />
    </Svg>
  );
});

function useClock(running: boolean) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      setMs(now - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return ms;
}

function Limb({ a, b, c, d, color }: { a: Pt; b: Pt; c: Pt; d?: Pt; color: string }) {
  const path = `M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y}${d ? ` L${d.x} ${d.y}` : ''}`;
  return <Path d={path} stroke={color} strokeWidth={LIMB} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
}

function Ground({ moving, ms }: { moving: boolean; ms: number }) {
  if (!moving) return <Line x1={14} x2={VIEW - 14} y1={GROUND} y2={GROUND} stroke={PROP} strokeWidth={2} strokeLinecap="round" />;
  const off = (ms / 6) % 24;
  return <Line x1={4} x2={VIEW - 4} y1={GROUND} y2={GROUND} stroke={PROP} strokeWidth={2} strokeDasharray="14 10" strokeDashoffset={off} />;
}

function Kettlebell({ hand, elbow }: { hand: Pt; elbow: Pt }) {
  // forearm pointing up → bell rests on the back of the forearm, otherwise it hangs
  const up = hand.y < elbow.y - 4;
  const c = up ? { x: hand.x - 7, y: hand.y + 5 } : { x: hand.x, y: hand.y + 12 };
  return (
    <G>
      <Line x1={hand.x} y1={hand.y} x2={c.x} y2={c.y} stroke={EQ} strokeWidth={3} />
      <Circle cx={c.x} cy={c.y} r={8.5} fill={EQ} />
    </G>
  );
}

function Dumbbell({ p, far }: { p: Pt; far?: boolean }) {
  return (
    <G opacity={far ? 0.55 : 1}>
      <Rect x={p.x - 9} y={p.y - 2} width={18} height={4} rx={2} fill={EQ} />
      <Circle cx={p.x - 8} cy={p.y} r={5} fill={EQ} />
      <Circle cx={p.x + 8} cy={p.y} r={5} fill={EQ} />
    </G>
  );
}

function Plate({ p }: { p: Pt }) {
  return (
    <G>
      <Circle cx={p.x} cy={p.y} r={14} fill={C.accentDim} stroke={EQ} strokeWidth={4} />
      <Circle cx={p.x} cy={p.y} r={3} fill={EQ} />
    </G>
  );
}

function Equipment({ anim, b }: { anim: Anim; b: Body }) {
  switch (anim.equip) {
    case 'kb1':
    case 'kb2':
      return <Kettlebell hand={b.handN} elbow={b.elbowN} />;
    case 'db1':
    case 'db2':
      return <Dumbbell p={b.handN} />;
    case 'bb':
      return <Plate p={b.handN} />;
    case 'bbBack':
      return <Plate p={{ x: b.shoulder.x - 6, y: b.shoulder.y - 2 }} />;
    case 'bbHip':
      return <Plate p={{ x: b.hip.x + 4, y: b.hip.y - 14 }} />;
    default:
      return null;
  }
}

/** Props behind the body (back) or in front of it. */
function Props({ anim, b, f, ms, back }: { anim: Anim; b: Body; f: Body; ms: number; back?: boolean }) {
  if (!anim.props) return null;
  return (
    <G>
      {anim.props.map((p, i) => {
        switch (p.kind) {
          case 'bar':
            return back ? null : <Line key={i} x1={f.handN.x - 38} x2={f.handN.x + 38} y1={f.handN.y} y2={f.handN.y} stroke={PROP} strokeWidth={5} strokeLinecap="round" />;
          case 'lowbar':
          case 'dipbar': {
            if (!back) return null;
            const y = f.handN.y + 1;
            const x0 = p.kind === 'lowbar' ? f.handN.x - 30 : f.handN.x - 22;
            const x1 = p.kind === 'lowbar' ? f.handN.x + 30 : f.handN.x + 14;
            return (
              <G key={i}>
                <Line x1={x0} x2={x1} y1={y} y2={y} stroke={PROP} strokeWidth={5} strokeLinecap="round" />
                <Line x1={x0 + 4} x2={x0 + 4} y1={y} y2={GROUND} stroke={PROP} strokeWidth={4} />
                <Line x1={x1 - 4} x2={x1 - 4} y1={y} y2={GROUND} stroke={PROP} strokeWidth={4} />
              </G>
            );
          }
          case 'bench': {
            if (!back) return null;
            const top = Math.max(f.hip.y, f.shoulder.y) + 8;
            const x0 = Math.min(f.hip.x, f.shoulder.x) - 14;
            const x1 = Math.max(f.hip.x, f.shoulder.x) + 8;
            return (
              <G key={i}>
                <Rect x={x0} y={top} width={x1 - x0} height={7} rx={3} fill={PROP} />
                <Line x1={x0 + 10} x2={x0 + 10} y1={top} y2={GROUND} stroke={PROP} strokeWidth={4} />
                <Line x1={x1 - 10} x2={x1 - 10} y1={top} y2={GROUND} stroke={PROP} strokeWidth={4} />
              </G>
            );
          }
          case 'benchShoulder': {
            if (!back) return null;
            const top = f.shoulder.y + 8;
            return <Rect key={i} x={f.shoulder.x - 34} y={top} width={34} height={GROUND - top} rx={4} fill={PROP} />;
          }
          case 'seat': {
            if (!back) return null;
            const top = f.hip.y + 8;
            return (
              <G key={i}>
                <Rect x={f.hip.x - 20} y={top} width={34} height={7} rx={3} fill={PROP} />
                <Line x1={f.hip.x - 3} x2={f.hip.x - 3} y1={top} y2={GROUND} stroke={PROP} strokeWidth={5} />
              </G>
            );
          }
          case 'platform': {
            if (back) return null;
            const dx = b.ankleN.x - b.hip.x;
            const dy = b.ankleN.y - b.hip.y;
            const l = Math.hypot(dx, dy) || 1;
            const ux = dx / l;
            const uy = dy / l;
            const c = { x: b.ankleN.x + ux * 7, y: b.ankleN.y + uy * 7 };
            return <Line key={i} x1={c.x - uy * 18} y1={c.y + ux * 18} x2={c.x + uy * 18} y2={c.y - ux * 18} stroke={PROP} strokeWidth={6} strokeLinecap="round" />;
          }
          case 'cable': {
            if (back) return null;
            const a = { x: f.handN.x + p.dx, y: f.handN.y + p.dy };
            return (
              <G key={i}>
                <Line x1={b.handN.x} y1={b.handN.y} x2={a.x} y2={a.y} stroke={PROP} strokeWidth={2} />
                <Circle cx={a.x} cy={a.y} r={5} fill={PROP} />
                <Rect x={b.handN.x - 7} y={b.handN.y - 2} width={14} height={4} rx={2} fill={EQ} />
              </G>
            );
          }
          case 'rope': {
            if (back) return null;
            const th = (ms / 440) * Math.PI * 2;
            const cx = b.hip.x + 2;
            const cy = (b.handN.y + b.toeN.y) / 2 - 18;
            const ry = (b.toeN.y - cy) + 6;
            const P = { x: cx + 22 * Math.sin(th), y: cy + ry * Math.cos(th) };
            return <Path key={i} d={`M${b.handN.x} ${b.handN.y} Q${cx + 40 * Math.sin(th)} ${(b.handN.y + P.y) / 2} ${P.x} ${P.y}`} stroke={EQ} strokeWidth={2.5} fill="none" />;
          }
          case 'bike': {
            if (!back) return null;
            const h = f.hip;
            const wy = h.y + 52;
            return (
              <G key={i}>
                <Circle cx={h.x - 22} cy={wy} r={17} stroke={PROP} strokeWidth={4} fill="none" />
                <Circle cx={h.x + 62} cy={wy} r={17} stroke={PROP} strokeWidth={4} fill="none" />
                <Path d={`M${h.x - 22} ${wy} L${h.x + 6} ${h.y + 48} L${h.x} ${h.y + 6} M${h.x + 6} ${h.y + 48} L${h.x + 56} ${h.y + 4} L${h.x + 62} ${wy} M${h.x} ${h.y + 6} L${h.x + 56} ${h.y + 4}`} stroke={PROP} strokeWidth={4} fill="none" strokeLinejoin="round" />
                <Rect x={h.x - 12} y={h.y + 4} width={22} height={6} rx={3} fill={PROP} />
                <Circle cx={h.x + 6} cy={h.y + 48} r={6} fill={PROP} />
              </G>
            );
          }
          case 'rower': {
            const railY = GROUND - 8;
            const fly = { x: f.toeN.x + 26, y: GROUND - 24 };
            if (back)
              return (
                <G key={i}>
                  <Line x1={f.hip.x - 50} x2={fly.x} y1={railY} y2={railY} stroke={PROP} strokeWidth={4} strokeLinecap="round" />
                  <Circle cx={fly.x} cy={fly.y} r={14} fill={PROP} />
                  <Rect x={b.hip.x - 14} y={b.hip.y + 6} width={26} height={6} rx={3} fill={PROP} />
                </G>
              );
            return <Line key={i} x1={b.handN.x} y1={b.handN.y} x2={fly.x} y2={fly.y} stroke={PROP} strokeWidth={2} />;
          }
          case 'step': {
            if (!back) return null;
            const h = Math.max(4, f.toeF.y - f.toeN.y);
            return <Rect key={i} x={f.ankleN.x - 16} y={GROUND - h} width={44} height={h} rx={3} fill={PROP} />;
          }
          default:
            return null;
        }
      })}
    </G>
  );
}

export function animationCycleMs(id: string) {
  const a = ANIMATIONS[id];
  return a ? cycleLength(a) : 0;
}
