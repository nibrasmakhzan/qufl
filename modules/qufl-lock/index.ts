// الجسر بين كود JavaScript والكود الأصلي (Kotlin) اللي يقفل الموبايل.
import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export type LockState = { enabled: boolean; doneDate: string; today: string; lockMinute: number };

type Native = {
  isAccessibilityEnabled(): boolean;
  canDrawOverlays(): boolean;
  openAccessibilitySettings(): void;
  openOverlaySettings(): void;
  openAppSettings(): void;
  setLockEnabled(enabled: boolean): void;
  setDoneDate(date: string): void;
  setLockTime(minutes: number): void;
  getState(): LockState;
  speak(text: string, lang: string): void;
  playAudio(name: string, rate: number): boolean;
  hasAudio(name: string): boolean;
  stopAudio(): void;
  voiceStatus(lang: string): number;
  installVoice(): void;
};

// على غير أندرويد (مثلاً لو فتحت المشروع بالويب) نرجّع نسخة وهمية حتى ما يطيح التطبيق.
const fallback: Native = {
  isAccessibilityEnabled: () => false,
  canDrawOverlays: () => false,
  openAccessibilitySettings: () => {},
  openOverlaySettings: () => {},
  openAppSettings: () => {},
  setLockEnabled: () => {},
  setDoneDate: () => {},
  setLockTime: () => {},
  speak: () => {},
  playAudio: () => false,
  hasAudio: () => false,
  stopAudio: () => {},
  voiceStatus: () => -2,
  installVoice: () => {},
  getState: () => ({ enabled: false, doneDate: '', today: '', lockMinute: 0 }),
};

let native: Native = fallback;
if (Platform.OS === 'android') {
  try {
    native = requireNativeModule<Native>('QuflLock');
  } catch {
    native = fallback;
  }
}

export default native;
