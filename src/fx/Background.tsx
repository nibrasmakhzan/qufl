// خلفية متدرجة تتحرك ببطء: بقع ضوء ملوّنة تطفو ورا الشاشة.
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { C } from '../theme';
import { lang } from '../lang';

const { width: W, height: H } = Dimensions.get('window');

function Blob({ color, size, x, y, dx, dy, dur }: {
  color: string; size: number; x: number; y: number; dx: number; dy: number; dur: number;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        opacity: 0.8,
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
        ],
      }}
    >
      {/* ضوء ناعم: تدرّج دائري من اللون للشفاف */}
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.9} />
            <Stop offset="0.45" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#g)" />
      </Svg>
    </Animated.View>
  );
}

export default function Background() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg, direction: 'ltr' }]} pointerEvents="none">
      <Blob color={lang.blob} size={W * 1.1} x={-W * 0.45} y={-H * 0.12} dx={W * 0.25} dy={H * 0.08} dur={9000} />
      <Blob color="#0F6E56" size={W * 1.0} x={W * 0.35} y={H * 0.45} dx={-W * 0.3} dy={-H * 0.1} dur={11000} />
      <Blob color="#5B3FA8" size={W * 0.8} x={W * 0.4} y={-H * 0.05} dx={-W * 0.15} dy={H * 0.12} dur={13000} />
      {/* طبقة تغميق حتى يبقى النص واضح */}
      <LinearGradient
        colors={['rgba(11,13,18,0.35)', 'rgba(11,13,18,0.75)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
