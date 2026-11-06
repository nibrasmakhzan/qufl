// النطق: أول شي نشغّل التسجيل الجاهز داخل التطبيق (صوت عصبي واضح، بدون إنترنت).
// إذا ما موجود، نستعمل محرّك Google للنطق بالموبايل.
import QuflLock from '../modules/qufl-lock';
import { lang } from './lang';

export function playWord(idx: number, text: string, rate = 1) {
  try {
    if (!QuflLock.playAudio(`w${idx}.ogg`, rate)) QuflLock.speak(text, lang.locale);
  } catch {}
}

export function playSentence(idx: number, text: string, rate = 1) {
  try {
    if (!QuflLock.playAudio(`e${idx}.ogg`, rate)) QuflLock.speak(text, lang.locale);
  } catch {}
}

export function stopAudio() {
  try {
    QuflLock.stopAudio();
  } catch {}
}

/** هل النطق مضمون؟ (تسجيلات داخل التطبيق، أو صوت اللغة منزّل بمحرّك الموبايل) */
export async function hasVoice(): Promise<boolean> {
  try {
    if (QuflLock.hasAudio('w0.ogg')) return true;
    for (let i = 0; i < 10; i++) {
      const st = QuflLock.voiceStatus(lang.locale);
      if (st !== -3) return st >= 0;
      await new Promise((r) => setTimeout(r, 400));
    }
  } catch {}
  return true;
}

export function openVoiceSettings() {
  QuflLock.installVoice();
}
