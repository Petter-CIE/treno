import { memo, useEffect, useMemo } from 'react';
import Animated, { Easing, cancelAnimation, useAnimatedProps, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { ANIMATIONS } from '@/data/animations';
import { VIEW, cycleLength } from '@/lib/figure';
import { LAYER_IDS, layerStyles, loopFor, stillFor, tempoFor, type LayerId, type LayerStyle } from '@/lib/figureDraw';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function hasAnimation(id: string) {
  return !!ANIMATIONS[id];
}

export { tempoFor };

/**
 * Looping pictogram of an exercise. The whole loop is precomputed once (30 fps) and played on the
 * UI thread by swapping path data, so it stays smooth even while the JS thread is busy.
 * `playing={false}` renders a still key pose.
 */
export const ExerciseAnimation = memo(function ExerciseAnimation({
  id,
  size = 200,
  playing = true,
  color,
  dim,
  frame = 0,
  arrows,
}: {
  id: string;
  size?: number;
  playing?: boolean;
  color?: string;
  dim?: boolean;
  /** which key pose to show when not playing */
  frame?: number;
  /** direction arrows (default: on for large views) */
  arrows?: boolean;
}) {
  const styles = useMemo(() => layerStyles(id, color), [id, color]);
  const showArrows = arrows ?? size >= 160;
  const anim = ANIMATIONS[id];
  if (!anim) return null;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`} opacity={dim ? 0.45 : 1}>
      {playing ? <Playing id={id} arrows={showArrows} styles={styles} /> : <Still id={id} frame={frame} styles={styles} />}
    </Svg>
  );
});

function attrs(s: LayerStyle) {
  return {
    fill: s.fill ?? 'none',
    stroke: s.stroke,
    strokeWidth: s.sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    opacity: s.op,
  };
}

function Still({ id, frame, styles }: { id: string; frame: number; styles: Record<LayerId, LayerStyle> }) {
  const d = useMemo(() => stillFor(id, frame), [id, frame]);
  if (!d) return null;
  return (
    <>
      {LAYER_IDS.map((k) => (k === 'arrow' || d[k] === 'M0 0' ? null : <Path key={k} d={d[k]} {...attrs(styles[k])} />))}
    </>
  );
}

function Playing({ id, arrows, styles }: { id: string; arrows: boolean; styles: Record<LayerId, LayerStyle> }) {
  const loop = useMemo(() => loopFor(id, arrows), [id, arrows]);
  const progress = useSharedValue(0);
  const cycle = loop?.cycle ?? cycleLength(ANIMATIONS[id]);
  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: cycle, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(progress);
  }, [cycle, progress]);
  if (!loop) return null;
  return (
    <>
      {LAYER_IDS.map((k) => {
        const frames = loop.paths[k];
        // layers that never draw anything are skipped entirely
        if (frames.every((d) => d === 'M0 0')) return null;
        return <Layer key={k} frames={frames} progress={progress} style={styles[k]} />;
      })}
    </>
  );
}

function Layer({ frames, progress, style }: { frames: string[]; progress: SharedValue<number>; style: LayerStyle }) {
  const n = frames.length;
  const animatedProps = useAnimatedProps(() => {
    const i = Math.min(n - 1, Math.floor(progress.value * n));
    return { d: frames[i] };
  });
  return <AnimatedPath animatedProps={animatedProps} d={frames[0]} {...attrs(style)} />;
}

export function animationCycleMs(id: string) {
  const a = ANIMATIONS[id];
  return a ? cycleLength(a) : 0;
}
