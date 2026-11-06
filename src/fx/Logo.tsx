// شعار «قُفل» المتحرك: الخط الأساسي يمتد، الحروف تطلع، والنقاط تسقط وتنط.
// مرسوم على شبكة 124×66، ومن اليمين: ق (نقطتين)، ف (نقطة)، ل (عمود طويل وحوضها تحت السطر).
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { C } from '../theme';

type Props = { size?: number; animate?: boolean; hop?: boolean };

export default function Logo({ size = 120, animate = true, hop = true }: Props) {
  const k = size / 124;
  const base = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const teeth = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(animate ? 0 : 1))).current;
  const jump = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const drop = (v: Animated.Value) =>
      Animated.timing(v, { toValue: 1, duration: 750, easing: Easing.bounce, useNativeDriver: true });
    Animated.sequence([
      Animated.timing(base, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(teeth, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.stagger(130, dots.map(drop)),
    ]).start(() => {
      if (!hop) return;
      Animated.loop(
        Animated.sequence([
          Animated.delay(3600),
          Animated.timing(jump, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(jump, { toValue: 0, duration: 420, easing: Easing.bounce, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const box = (l: number, t: number, w: number, h: number) => ({
    position: 'absolute' as const,
    left: l * k,
    top: t * k,
    width: w * k,
    height: h * k,
  });
  const ink = C.fg;
  const loop = (l: number) => ({
    ...box(l, 20, 26, 28),
    borderWidth: 9 * k,
    borderColor: ink,
    borderRadius: 13 * k,
    transformOrigin: 'bottom' as const,
    transform: [{ scale: teeth }],
  });
  const dot = (l: number, i: number) => ({
    ...box(l, 2, 11, 11),
    borderRadius: 6 * k,
    backgroundColor: C.accent,
    opacity: dots[i],
    transform: [
      { translateY: dots[i].interpolate({ inputRange: [0, 1], outputRange: [-46 * k, 0] }) },
      { translateY: jump.interpolate({ inputRange: [0, 1], outputRange: [0, -9 * k] }) },
    ],
  });

  return (
    <View style={{ width: 124 * k, height: 66 * k, direction: 'ltr' }} accessibilityLabel="قُفل">
      {/* الخط الأساسي */}
      <Animated.View
        style={{
          ...box(24, 40, 92, 10),
          borderRadius: 5 * k,
          backgroundColor: ink,
          transformOrigin: 'right',
          transform: [{ scaleX: base }],
        }}
      />
      {/* ل: عمود طويل */}
      <Animated.View
        style={{
          ...box(24, 0, 10, 50),
          borderRadius: 5 * k,
          backgroundColor: ink,
          transformOrigin: 'bottom',
          transform: [{ scaleY: teeth }],
        }}
      />
      {/* ل: الحوض تحت السطر */}
      <Animated.View
        style={{
          ...box(4, 30, 30, 34),
          borderColor: ink,
          borderLeftWidth: 9 * k,
          borderRightWidth: 9 * k,
          borderBottomWidth: 9 * k,
          borderTopWidth: 0,
          borderBottomLeftRadius: 15 * k,
          borderBottomRightRadius: 15 * k,
          transformOrigin: 'top',
          transform: [{ scaleY: teeth }],
        }}
      />
      {/* ف و ق */}
      <Animated.View style={loop(52)} />
      <Animated.View style={loop(90)} />
      {/* النقاط */}
      <Animated.View style={dot(59.5, 1)} />
      <Animated.View style={dot(89, 0)} />
      <Animated.View style={dot(104, 2)} />
    </View>
  );
}
