import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { C } from '@/lib/theme';

/** Layered Nordic mountain ridges with a small cairn (varde) on the front peak. */
export function Mountains({ height = 120 }: { height?: number }) {
  const [w, setW] = useState(360);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const h = height;
  const y = (f: number) => h * f;
  const x = (f: number) => w * f;
  const back = `M0 ${y(0.62)} L${x(0.12)} ${y(0.38)} L${x(0.22)} ${y(0.5)} L${x(0.38)} ${y(0.18)} L${x(0.52)} ${y(0.44)} L${x(0.66)} ${y(0.26)} L${x(0.8)} ${y(0.46)} L${x(0.92)} ${y(0.3)} L${w} ${y(0.42)} L${w} ${h} L0 ${h} Z`;
  const front = `M0 ${y(0.82)} L${x(0.18)} ${y(0.6)} L${x(0.3)} ${y(0.72)} L${x(0.5)} ${y(0.5)} L${x(0.64)} ${y(0.7)} L${x(0.78)} ${y(0.56)} L${w} ${y(0.8)} L${w} ${h} L0 ${h} Z`;
  // cairn on the right-hand front peak
  const cx = x(0.78);
  const cy = y(0.56);
  const stone = (dy: number, rx: number, ry: number) => `M${cx - rx} ${cy - dy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
  return (
    <View onLayout={onLayout} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h }}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.surface2} stopOpacity="1" />
            <Stop offset="1" stopColor={C.bg} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.border} stopOpacity="0.9" />
            <Stop offset="1" stopColor={C.bg} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={back} fill="url(#snow)" />
        <Path d={front} fill="url(#ridge)" />
        <Path d={stone(4, 9, 4)} fill={C.muted} opacity={0.55} />
        <Path d={stone(11, 7, 3.4)} fill={C.muted} opacity={0.65} />
        <Path d={stone(17, 5, 2.8)} fill={C.text} opacity={0.6} />
      </Svg>
    </View>
  );
}
