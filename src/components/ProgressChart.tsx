import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { addDays, fmtDate, startOfWeek, ymd } from '@/lib/dates';
import { LANG_TAG } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { C, FONT } from '@/lib/theme';
import { fromKg } from '@/lib/units';

function useWidth(initial = 300) {
  const [w, setW] = useState(initial);
  return [w, (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)] as const;
}

/** Heaviest load per session for one exercise. */
export function ProgressChart({ exId, height = 140 }: { exId: string; height?: number }) {
  const { log, settings, lang } = useStore();
  const [width, onLayout] = useWidth();
  const pts = log
    .map((l) => ({ date: l.date, kg: Math.max(0, ...l.sets.filter((s) => s.ex === exId).map((s) => s.weightKg ?? 0)) }))
    .filter((p) => p.kg > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20);

  if (pts.length === 0) return null;
  const vals = pts.map((p) => fromKg(p.kg, settings.unit));
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const pad = 22;
  const range = max - min || 1;
  const x = (i: number) => pad + (pts.length === 1 ? (width - 2 * pad) / 2 : (i * (width - 2 * pad)) / (pts.length - 1));
  const y = (v: number) => height - pad - ((v - min) / range) * (height - 2 * pad);
  const tag = LANG_TAG[lang];

  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        <Line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke={C.border} />
        <Polyline points={vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={C.accent} strokeWidth={2.5} />
        {vals.map((v, i) => (
          <Circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={C.accent} />
        ))}
        <SvgText fontFamily={FONT[600]} x={pad} y={12} fill={C.muted} fontSize={11}>
          {`${Math.round(max)} ${settings.unit === 'imperial' ? 'lb' : 'kg'}`}
        </SvgText>
        <SvgText fontFamily={FONT[600]} x={pad} y={height - 6} fill={C.faint} fontSize={10}>
          {fmtDate(pts[0].date, tag, { day: 'numeric', month: 'short' })}
        </SvgText>
        <SvgText fontFamily={FONT[600]} x={width - pad} y={height - 6} fill={C.faint} fontSize={10} textAnchor="end">
          {fmtDate(pts[pts.length - 1].date, tag, { day: 'numeric', month: 'short' })}
        </SvgText>
      </Svg>
    </View>
  );
}

/** Training minutes per week, last 8 weeks. */
export function WeeklyBars({ height = 130 }: { height?: number }) {
  const { log, t } = useStore();
  const [width, onLayout] = useWidth();
  const monday = startOfWeek(new Date());
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(monday, (i - 7) * 7);
    const a = ymd(start);
    const b = ymd(addDays(start, 6));
    const entries = log.filter((l) => l.date >= a && l.date <= b);
    return { label: `${start.getDate()}.${start.getMonth() + 1}.`, min: Math.round(entries.reduce((s, l) => s + l.durationSec, 0) / 60), n: entries.length };
  });
  const max = Math.max(1, ...weeks.map((w) => w.min));
  const pad = 18;
  const bw = (width - pad * 2) / weeks.length;
  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        {weeks.map((w, i) => {
          const h = ((height - 40) * w.min) / max;
          const isCurrent = i === weeks.length - 1;
          return (
            <Rect key={i} x={pad + i * bw + bw * 0.18} y={height - 22 - h} width={bw * 0.64} height={Math.max(h, 2)} rx={4} fill={isCurrent ? C.accent : C.chartBar} />
          );
        })}
        {weeks.map((w, i) =>
          w.min ? (
            <SvgText fontFamily={FONT[600]} key={`v${i}`} x={pad + i * bw + bw / 2} y={height - 26 - ((height - 40) * w.min) / max} fill={C.muted} fontSize={10} textAnchor="middle">
              {`${w.min}`}
            </SvgText>
          ) : null,
        )}
        {weeks.map((w, i) => (
          <SvgText fontFamily={FONT[600]} key={`l${i}`} x={pad + i * bw + bw / 2} y={height - 6} fill={C.faint} fontSize={9} textAnchor="middle">
            {w.label}
          </SvgText>
        ))}
      </Svg>
      <View style={{ position: 'absolute', right: 0, top: 0 }}>
        <SvgLabel text={`${t('common.min')} / ${t('plan.week', { n: '' }).trim()}`} />
      </View>
    </View>
  );
}

function SvgLabel({ text }: { text: string }) {
  return (
    <Svg width={140} height={14}>
      <SvgText fontFamily={FONT[600]} x={140} y={11} fill={C.faint} fontSize={10} textAnchor="end">
        {text}
      </SvgText>
    </Svg>
  );
}
