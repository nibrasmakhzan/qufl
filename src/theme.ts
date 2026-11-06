import { StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { lang } from './lang';

// الألوان: خلفية ليلية، بطاقات زجاجية، ولون اللغة للأزرار (أزرق / أحمر / ذهبي)
export const C = {
  bg: '#0B0D12',
  glass: 'rgba(255,255,255,0.06)',
  glassStrong: 'rgba(255,255,255,0.10)',
  glassLine: 'rgba(255,255,255,0.13)',
  fg: '#EEF1FF',
  muted: '#9AA3C7',
  accent: lang.accent,
  accentFg: '#0B0D12',
  teal: '#2BC4A0',
  amber: '#FAC775',
  good: '#5DDC9A',
  bad: '#FF8A73',
};

// الخطوط: المسيري للعربي، لاله‌زار للعناوين، وخط النظام للكلمات الأجنبية (بيه كل الحروف)
export const F = {
  body: 'ElMessiri_400Regular',
  medium: 'ElMessiri_500Medium',
  bold: 'ElMessiri_700Bold',
  title: 'Lalezar_400Regular',
  latin: 'sans-serif',
  latinBold: 'sans-serif-medium',
};

export const buzz = {
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  good: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  bad: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};

// التطبيق مقلوب لليمين (RTL) دائماً، فـ textAlign: 'left' يعني "بداية السطر" = يمين.
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  pad: { paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  h1: { color: C.fg, fontSize: 30, fontFamily: F.title, textAlign: 'left', lineHeight: 46 },
  h2: { color: C.fg, fontSize: 19, fontFamily: F.title, textAlign: 'left', lineHeight: 30 },
  p: { color: C.fg, fontSize: 16, lineHeight: 26, fontFamily: F.body, textAlign: 'left' },
  muted: { color: C.muted, fontSize: 13.5, lineHeight: 21, fontFamily: F.body, textAlign: 'left' },
  en: { writingDirection: 'ltr', textAlign: 'center', fontFamily: F.latin },
  glass: {
    backgroundColor: C.glass,
    borderColor: C.glassLine,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  btn: { backgroundColor: C.accent, borderRadius: 18, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: C.accentFg, fontSize: 18, fontFamily: F.title },
  ghost: {
    borderColor: C.glassLine,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  ghostText: { color: C.muted, fontSize: 14, fontFamily: F.medium },
  chip: {
    borderColor: C.glassLine,
    borderWidth: 1,
    borderRadius: 99,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.muted, fontSize: 13, fontFamily: F.medium },
  chipTextOn: { color: C.accentFg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' },
});
