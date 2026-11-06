// إعدادات اللغة الحالية (تنحط وقت البناء بـ tools/use-lang.js).
import L from './data/lang.json';

export type Lang = {
  code: 'en' | 'tr' | 'es';
  appName: string;
  nameAr: string; // «الإنكليزي» / «التركي» / «الإسباني»
  tag: string;
  locale: string;
  placeholder: string;
  accent: string;
  blob: string;
  fold: Record<string, string>; // حروف خاصة نقبلها بدون علاماتها (ş → s)
};

export const lang = L as unknown as Lang;
