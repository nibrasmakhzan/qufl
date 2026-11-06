// الزر الرئيسي: تنبض حوله هالة ضوء، مثل زر التنزيل بموقع سعي.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { buzz, C, s } from '../theme';

export default function GlowButton({ label, onPress, glow = true }: {
  label: string; onPress: () => void; glow?: boolean;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!glow) return;
    Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true })
    ).start();
  }, [glow]);
  return (
    <View>
      {glow && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            start: 0,
            end: 0,
            borderRadius: 18,
            backgroundColor: C.accent,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
            transform: [
              { scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
              { scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) },
            ],
          }}
        />
      )}
      <Animated.View style={{ transform: [{ scale: press }] }}>
        <Pressable
          onPressIn={() => Animated.spring(press, { toValue: 0.96, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(press, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
          onPress={() => {
            buzz.tap();
            onPress();
          }}
          style={s.btn}
        >
          <Text style={s.btnText}>{label}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
