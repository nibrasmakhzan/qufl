// قصاصات احتفال تنزل من فوق لما ينفتح القفل.
import { useEffect, useMemo } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { C } from '../theme';

const { width: W, height: H } = Dimensions.get('window');
const COLORS = [C.accent, '#2BC4A0', '#FAC775', '#FF8A73', '#EEF1FF', '#B59CFF'];

export default function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        v: new Animated.Value(0),
        x: Math.random() * W,
        drift: (Math.random() - 0.5) * 140,
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 10,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
        delay: Math.random() * 600,
        dur: 2200 + Math.random() * 1600,
        color: COLORS[i % COLORS.length],
      })),
    []
  );
  useEffect(() => {
    Animated.parallel(
      pieces.map((p) =>
        Animated.timing(p.v, {
          toValue: 1,
          duration: p.dur,
          delay: p.delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);
  return (
    <View style={[StyleSheet.absoluteFill, { direction: 'ltr' }]} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: -30,
            width: p.w,
            height: p.h,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, H + 60] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
