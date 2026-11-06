// حلقة تقدم دائرية تتعبّى بحركة ناعمة.
import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { C } from '../theme';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const ACircle = Animated.createAnimatedComponent(Circle);

export default function Ring({ progress, size = 180, stroke = 14, from = C.accent, to = '#2BC4A0', children }: {
  progress: number; size?: number; stroke?: number; from?: string; to?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.09)" strokeWidth={stroke} fill="none" />
        <ACircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#rg)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={v.interpolate({ inputRange: [0, 1], outputRange: [len, 0] })}
        />
      </Svg>
      {children}
    </View>
  );
}
